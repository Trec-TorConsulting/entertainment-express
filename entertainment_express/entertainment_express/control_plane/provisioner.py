"""
Tenant provisioner — runs as a background job on the control-plane site.

ISOLATION RULE: This is the ONLY control-plane code that touches tenant sites.
                It does so via `bench` subprocess calls and frappe.init(site=...).
                Tenant feature code NEVER calls back into the control plane.

Idempotency: Every step is safe to re-run. Already-completed steps are skipped.
"""

import json
import os
import re
import subprocess
import frappe
from frappe.utils import now_datetime

# Slugs reserved for infrastructure/admin — never tenant-assignable.
RESERVED_SLUGS = frozenset([
    "admin", "www", "api", "app", "mail", "smtp", "ftp", "ssh",
    "ns1", "ns2", "static", "assets", "status", "health",
])


def validate_slug(slug: str, exclude_tenant_name: str | None = None) -> None:
    """
    Validate a tenant slug is DNS-safe, not reserved, and not already taken.
    Raises frappe.ValidationError on failure.
    """
    if not re.fullmatch(r"[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]", slug):
        frappe.throw(
            "Tenant slug must be 3–50 lowercase alphanumeric characters or hyphens, "
            "starting and ending with alphanumeric.",
            frappe.ValidationError,
        )
    if slug in RESERVED_SLUGS:
        frappe.throw(f"'{slug}' is a reserved slug.", frappe.ValidationError)
    existing = frappe.db.get_value("Tenant", {"tenant_slug": slug}, "name")
    if existing and existing != exclude_tenant_name:
        frappe.throw(f"Slug '{slug}' is already taken.", frappe.ValidationError)


def enqueue_provision(provisioning_job_name: str) -> None:
    """Enqueue a provisioning job on the long queue."""
    frappe.enqueue(
        "entertainment_express.control_plane.provisioner.run_provisioning_job",
        provisioning_job_name=provisioning_job_name,
        queue="long",
        is_async=True,
    )


def run_provisioning_job(provisioning_job_name: str) -> None:
    """
    Entry point called by the background worker.
    Loads the Provisioning Job and runs the appropriate action.
    """
    job = frappe.get_doc("Provisioning Job", provisioning_job_name)
    if job.state in ("succeeded", "running"):
        return  # Already done or in-flight from another worker

    _update_job(job, state="running")

    try:
        if job.action == "create":
            _provision_create(job)
        elif job.action == "suspend":
            _provision_suspend(job)
        elif job.action == "resume":
            _provision_resume(job)
        elif job.action == "deprovision":
            _provision_deprovision(job)
        _update_job(job, state="succeeded")
    except Exception as exc:
        job.reload()
        _update_job(job, state="failed", log_line=f"ERROR: {exc}")
        frappe.logger().error(f"[EE provisioner] {provisioning_job_name} failed: {exc}")
        raise


def _provision_create(job) -> None:
    """Create a new tenant site, install apps, bootstrap, mark active."""
    tenant = frappe.get_doc("Tenant", job.tenant)
    base_domain = frappe.conf.get("ee_base_domain", "entertainmentexpress.app")
    # Tenant sites are <slug>.<ee_tenant_domain>. Defaults to app.<base_domain> to
    # preserve the historical scheme; deployments can set ee_tenant_domain to serve
    # tenants directly under the base domain (e.g. <slug>.entx.app).
    tenant_domain = frappe.conf.get("ee_tenant_domain") or f"app.{base_domain}"
    site_name = f"{tenant.tenant_slug}.{tenant_domain}"

    _log(job, f"Provisioning site: {site_name}")

    # 1. Validate slug (belt-and-suspenders; was validated at Signup approve time too)
    validate_slug(tenant.tenant_slug, exclude_tenant_name=tenant.name)

    # 2. Create site (idempotent)
    bench_root = _bench_root()
    if not os.path.isdir(os.path.join(bench_root, "sites", site_name)):
        _log(job, "Creating Frappe site...")
        _bench_exec(job, [
            "bench", "new-site", site_name,
            "--db-host", "mariadb",
            "--admin-password", _get_secret("administrator-password"),
            "--mariadb-root-password", _get_secret("mariadb-root-password"),
            "--no-mariadb-socket",
        ])
    else:
        _log(job, "Site already exists — skipping new-site.")

    # 3. Install apps (idempotent)
    for app in ("erpnext", "entertainment_express"):
        installed = _bench_exec_out(job, [
            "bench", "--site", site_name, "list-apps"
        ])
        if app not in installed:
            _log(job, f"Installing {app}...")
            _bench_exec(job, ["bench", "--site", site_name, "install-app", app])
        else:
            _log(job, f"{app} already installed.")

    # 4. Migrate (applies fixtures / roles)
    _log(job, "Running migrate...")
    _bench_exec(job, ["bench", "--site", site_name, "migrate"])

    # 5. Bootstrap tenant data — run INSIDE the tenant site as a subprocess so the
    #    control-plane job's own frappe context stays bound. Never call
    #    bootstrap.run() in-process here: it does frappe.destroy() and would unbind
    #    this job, leaving the Provisioning Job stuck in "running".
    _log(job, "Bootstrapping tenant...")
    bootstrap_kwargs = json.dumps({
        "company_name": tenant.company_name,
        "primary_email": tenant.get("primary_email") or "",
        "primary_contact": tenant.get("primary_contact") or "",
    })
    _bench_exec(job, [
        "bench", "--site", site_name, "execute",
        "entertainment_express.control_plane.bootstrap.run_bootstrap",
        "--kwargs", bootstrap_kwargs,
    ])

    # 6. Set host_name
    _bench_exec(job, [
        "bench", "--site", site_name,
        "set-config", "host_name", f"https://{site_name}",
    ])

    # 7. Mark Tenant active
    tenant.reload()
    tenant.status = "active"
    tenant.site_name = site_name
    tenant.activated_on = now_datetime()
    tenant.save(ignore_permissions=True)
    frappe.db.commit()

    _log(job, f"Tenant {tenant.tenant_slug} provisioned successfully at {site_name}.")

    # 8. Send welcome email
    from entertainment_express.notifications import send
    send("welcome_tenant", tenant.primary_email, {
        "company_name": tenant.company_name,
        "site_url": f"https://{site_name}",
        "tenant_slug": tenant.tenant_slug,
    })


def _provision_suspend(job) -> None:
    tenant = frappe.get_doc("Tenant", job.tenant)
    _log(job, f"Suspending tenant {tenant.tenant_slug}...")
    if tenant.site_name:
        _bench_exec(job, ["bench", "--site", tenant.site_name, "set-maintenance-mode", "on"])
    tenant.reload()
    tenant.status = "suspended"
    tenant.suspended_on = now_datetime()
    tenant.save(ignore_permissions=True)
    frappe.db.commit()


def _provision_resume(job) -> None:
    tenant = frappe.get_doc("Tenant", job.tenant)
    _log(job, f"Resuming tenant {tenant.tenant_slug}...")
    if tenant.site_name:
        _bench_exec(job, ["bench", "--site", tenant.site_name, "set-maintenance-mode", "off"])
    tenant.reload()
    tenant.status = "active"
    tenant.suspended_on = None
    tenant.save(ignore_permissions=True)
    frappe.db.commit()


def _provision_deprovision(job) -> None:
    tenant = frappe.get_doc("Tenant", job.tenant)
    _log(job, f"Deprovisioning tenant {tenant.tenant_slug} — THIS IS DESTRUCTIVE.")
    site_name = tenant.site_name
    if site_name:
        # Must pass root password non-interactively — bare `drop-site --force` prompts
        # and aborts in containerized / CI environments. Never put the password into
        # process argv that gets echoed into job logs; use an env override instead.
        root_pw = _get_secret("mariadb-root-password")
        env = os.environ.copy()
        env["MYSQL_ROOT_PASSWORD"] = root_pw
        try:
            _bench_exec(
                job,
                [
                    "bench", "drop-site", site_name,
                    "--force",
                    "--no-backup",
                    "--db-root-password", root_pw,
                ],
                env=env,
            )
        except Exception as exc:
            # DB drop often succeeds before archive/move; treat leftover site dirs as
            # best-effort cleanup so Tenant can still reach status=deleted.
            _log(job, f"drop-site raised ({exc}); forcing site directory cleanup.")
            _force_remove_site_dir(job, site_name)
        else:
            # Ensure nothing remains under sites/ even if move left residues (NFS locks).
            _force_remove_site_dir(job, site_name)
    tenant.reload()
    tenant.status = "deleted"
    tenant.save(ignore_permissions=True)
    frappe.db.commit()


def _force_remove_site_dir(job, site_name: str) -> None:
    site_path = os.path.join(_bench_root(), "sites", site_name)
    if not os.path.isdir(site_path):
        return
    try:
        import shutil
        shutil.rmtree(site_path, ignore_errors=True)
        _log(job, f"Removed site directory {site_path}")
    except Exception as exc:
        _log(job, f"Could not fully remove {site_path}: {exc}")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _bench_root() -> str:
    """Absolute path to the Frappe bench root."""
    return os.environ.get("FRAPPE_BENCH_ROOT", "/home/frappe/frappe-bench")


def _bench_exec(job, cmd: list[str], env: dict | None = None) -> None:
    result = subprocess.run(
        cmd, cwd=_bench_root(),
        capture_output=True, text=True, timeout=600,
        env=env,
    )
    _log(job, _redact_secrets(result.stdout[-3000:] if result.stdout else ""))
    if result.returncode != 0:
        raise RuntimeError(
            f"Command {_redact_secrets(' '.join(cmd))} failed:\n"
            f"{_redact_secrets(result.stderr[-2000:] if result.stderr else '')}"
        )


def _redact_secrets(text: str) -> str:
    """Strip credential material from provisioner logs / error strings."""
    if not text:
        return text
    import re
    text = re.sub(r"(--db-root-password|--admin-password|--mariadb-root-password)\s+\S+",
                  r"\1 ***REDACTED***", text)
    text = re.sub(r"(password=)[^\s&]+", r"\1***REDACTED***", text, flags=re.I)
    return text


def _bench_exec_out(job, cmd: list[str]) -> str:
    result = subprocess.run(
        cmd, cwd=_bench_root(),
        capture_output=True, text=True, timeout=60,
    )
    return result.stdout


def _get_secret(key: str) -> str:
    """Read a secret from the EE secrets (injected as env vars from K8s secret)."""
    env_map = {
        "administrator-password": "EE_ADMIN_PASSWORD",
        "mariadb-root-password": "EE_MARIADB_ROOT_PASSWORD",
    }
    val = os.environ.get(env_map.get(key, key.upper().replace("-", "_")))
    if not val:
        raise RuntimeError(f"Secret '{key}' not found in environment.")
    return val


def _update_job(job, state: str, log_line: str = "") -> None:
    job.reload()
    job.state = state
    job.attempts = (job.attempts or 0) + (1 if state == "running" else 0)
    if log_line:
        job.log = (job.log or "") + f"\n{now_datetime()} {log_line}"
    job.save(ignore_permissions=True)
    frappe.db.commit()


def _log(job, message: str) -> None:
    frappe.logger().info(f"[EE provisioner][{job.name}] {message}")
    job.log = (job.log or "") + f"\n{now_datetime()} {message}"
    job.save(ignore_permissions=True)
    frappe.db.commit()
