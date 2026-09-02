"""AI assistant APIs. This site only. Confirm before money/send/assign."""

from __future__ import annotations

import hashlib
import time
from collections import defaultdict
from datetime import timedelta

import frappe
from frappe.utils import add_days, flt, fmt_money, getdate, nowdate

from entertainment_express.ai.llm import UNAVAILABLE, complete
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
CREW_ROLES = {"EE Crew", "EE Entertainer"}
ASK_ROLES = OWNER_ROLES | {"EE Sales", "EE Office", "EE Dispatcher"}
QUOTE_ROLES = OWNER_ROLES | {"EE Sales"}
DISPATCH_ROLES = OWNER_ROLES | {"EE Dispatcher"}
GROW_ROLES = OWNER_ROLES | {"EE Marketing"}


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _deny_guest() -> None:
    user = _user()
    if user in ("Guest", "guest") or not user:
        frappe.throw("Not allowed.", frappe.PermissionError)
    roles = _roles()
    staff = OWNER_ROLES | {"EE Sales", "EE Office", "EE Dispatcher", "EE Marketing", "EE Accounting", "System Manager"}
    if GUEST_ROLE in roles and not roles.intersection(staff):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require(allowed: set[str]) -> None:
    _deny_guest()
    roles = _roles()
    if not roles.intersection(allowed) and "System Manager" not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)


def _entitled() -> None:
    _deny_guest()
    conf = getattr(frappe, "conf", None)
    flag = None
    if conf is not None:
        getter = getattr(conf, "get", None)
        if callable(getter):
            flag = getter("ee_ai_assistant")
        elif isinstance(conf, dict):
            flag = conf.get("ee_ai_assistant")
    if flag in (0, "0", False):
        frappe.throw(
            "This feature is not on your plan. Upgrade in Entertainment Express billing to unlock it.",
            frappe.PermissionError,
        )
    try:
        settings = frappe.get_single("EE AI Settings")
        if settings and int(getattr(settings, "enabled", 1) or 0) == 0:
            frappe.throw(
                "This feature is not on your plan. Upgrade in Entertainment Express billing to unlock it.",
                frappe.PermissionError,
            )
    except Exception:
        pass


def _currency() -> str:
    return frappe.db.get_default("currency") or "USD"


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=_currency())


def _log(kind: str, status: str, prompt: str = "", latency_ms: int = 0) -> None:
    try:
        if not getattr(frappe.db, "table_exists", lambda *_: True)("EE AI Call"):
            return
        digest = hashlib.sha256((prompt or "").encode()).hexdigest()[:16] if prompt else ""
        frappe.get_doc(
            {
                "doctype": "EE AI Call",
                "user": _user(),
                "kind": kind,
                "status": status,
                "prompt_hash": digest,
                "latency_ms": latency_ms,
            }
        ).insert(ignore_permissions=True)
    except Exception:
        pass


def _settings_payload() -> dict:
    try:
        doc = frappe.get_single("EE AI Settings")
        provider = getattr(doc, "provider", None) or "ollama"
        model = getattr(doc, "model", None) or "llama3.2"
        enabled = int(getattr(doc, "enabled", 1) or 0)
    except Exception:
        provider, model, enabled = "ollama", "llama3.2", 1
    return {"provider": provider, "model": model, "enabled": enabled}


@frappe.whitelist()
def status() -> dict:
    _entitled()
    _require(ASK_ROLES | DISPATCH_ROLES | GROW_ROLES)
    text = complete("Reply with the single word pong.")
    available = bool(text)
    return {**_settings_payload(), "available": available, "message": "" if available else UNAVAILABLE}


@frappe.whitelist()
def save_settings(values: dict | str | None = None) -> dict:
    _entitled()
    _require(OWNER_ROLES)
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    doc = frappe.get_single("EE AI Settings")
    if "enabled" in values:
        doc.enabled = int(values.get("enabled") or 0)
    if values.get("provider") in {"ollama", "openai", "gemini"}:
        doc.provider = values["provider"]
    if values.get("model"):
        doc.model = values["model"]
    if values.get("openai_key"):
        doc.openai_key = values["openai_key"]
    if values.get("gemini_key"):
        doc.gemini_key = values["gemini_key"]
    doc.save(ignore_permissions=True)
    return _settings_payload()


def _weekend_jobs() -> list[dict]:
    start = getdate()
    end = add_days(start, 7)
    rows = []
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        return rows
    for job in frappe.get_all(
        "Event Booking",
        filters={"event_date": ["between", [str(start), str(end)]], "is_template": 0},
        fields=["name", "event_name", "event_date", "status"],
        limit_page_length=50,
    ) or []:
        assigned = frappe.db.count(
            "Crew Assignment",
            {"booking": job.name, "status": ["in", ["accepted", "checked_in", "completed"]]},
        )
        rows.append(
            {
                "id": job.name,
                "title": job.event_name or job.name,
                "when": str(job.event_date or ""),
                "status": job.status,
                "unassigned": int(assigned or 0) == 0,
            }
        )
    return rows


def _facts_blob() -> str:
    jobs = _weekend_jobs()
    lines = [f"- {j['title']} on {j['when']} ({'needs crew' if j['unassigned'] else 'staffed'})" for j in jobs]
    return "This company's jobs in the next 7 days:\n" + ("\n".join(lines) if lines else "(none)")


@frappe.whitelist()
def ask(message: str, conversation: str | None = None) -> dict:
    _entitled()
    _require(ASK_ROLES)
    if CREW_ROLES.intersection(_roles()) and not _roles().intersection(OWNER_ROLES | {"EE Dispatcher", "EE Sales", "EE Office"}):
        frappe.throw("Not allowed.", frappe.PermissionError)
    started = time.time()
    facts = _facts_blob()
    prompt = (
        f"You help a mobile entertainment company on this site only. "
        f"Use only these facts. Do not invent prices.\n{facts}\n\nQuestion: {message or ''}"
    )
    prose = complete(prompt)
    elapsed = int((time.time() - started) * 1000)
    available = bool(prose)
    _log("ask", "ok" if available else "unavailable", prompt, elapsed)
    fallback = "Here is what is on the books this week."
    if not available:
        fallback = UNAVAILABLE + " " + fallback
    return {
        "available": available,
        "message": prose or fallback,
        "jobs": _weekend_jobs(),
        "draft": None,
    }


def _event_type_for(source: str, name: str) -> str:
    if source == "job" and getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        return frappe.db.get_value("Event Booking", name, "event_type") or ""
    return ""


@frappe.whitelist()
def suggest_quote(source: str | None = None, name: str | None = None, event_type: str | None = None) -> dict:
    _entitled()
    _require(QUOTE_ROLES)
    started = time.time()
    kind = event_type or _event_type_for(source or "", name or "")
    totals = []
    item_counts: dict[str, list] = defaultdict(list)
    packages: dict[str, int] = defaultdict(int)
    if getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        filters = {"status": ["in", ["confirmed", "completed"]], "is_template": 0}
        if kind:
            filters["event_type"] = kind
        for job in frappe.get_all(
            "Event Booking",
            filters=filters,
            fields=["name", "grand_total", "event_type"],
            limit_page_length=40,
            order_by="event_date desc",
        ) or []:
            totals.append(flt(job.grand_total))
            if getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking Item"):
                for line in frappe.get_all(
                    "Event Booking Item",
                    filters={"parent": job.name},
                    fields=["item", "item_name", "qty", "rate", "service_package"],
                    limit_page_length=50,
                ) or []:
                    key = line.service_package or line.item
                    if not key:
                        continue
                    item_counts[key].append(
                        {
                            "id": line.service_package or line.item,
                            "kind": "package" if line.service_package else "item",
                            "name": line.item_name or line.item,
                            "qty": flt(line.qty or 1),
                            "rate_raw": flt(line.rate),
                            "rate": _money(line.rate),
                        }
                    )
                    if line.service_package:
                        packages[line.service_package] += 1
    items = []
    for key, rows in sorted(item_counts.items(), key=lambda kv: -len(kv[1]))[:8]:
        sample = rows[0]
        items.append(sample)
    amounts = sorted(totals) if totals else [0]
    mid = amounts[len(amounts) // 2]
    range_payload = {"low": _money(amounts[0]), "mid": _money(mid), "high": _money(amounts[-1])}
    why_bits = f"Based on {len(totals)} similar jobs on this company."
    prose = complete(f"In one sentence, explain this package mix for a {kind or 'typical'} event. Do not mention dollar amounts. Items: {[i['name'] for i in items]}")
    available = bool(prose)
    _log("quote", "ok" if available else "unavailable", kind or "", int((time.time() - started) * 1000))
    return {
        "available": available,
        "message": prose if available else UNAVAILABLE,
        "why": prose or why_bits,
        "items": items,
        "packages": [{"id": k, "jobs": n} for k, n in packages.items()],
        "range": range_payload,
        "source": source,
        "name": name,
    }


@frappe.whitelist()
def forecast(months: int = 3) -> dict:
    _entitled()
    _require(OWNER_ROLES)
    started = time.time()
    months = max(1, min(12, int(months or 3)))
    today = getdate()
    periods = []
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        prose = complete("Say the forecast is empty.")
        return {
            "available": bool(prose),
            "message": prose or UNAVAILABLE,
            "periods": [],
        }
    for offset in range(months):
        month_start = (today.replace(day=1) + timedelta(days=32 * offset)).replace(day=1) if hasattr(today, "replace") else today
        try:
            year, month = month_start.year, month_start.month
        except Exception:
            year, month = 2026, 9 + offset
        label = f"{year}-{month:02d}"
        jobs = frappe.get_all(
            "Event Booking",
            filters={"is_template": 0},
            fields=["name", "event_date", "grand_total", "status"],
            limit_page_length=500,
        ) or []
        hist = 0
        hist_rev = 0.0
        pipeline = 0
        pipe_rev = 0.0
        for job in jobs:
            raw = str(job.event_date or "")
            if len(raw) < 7:
                continue
            if raw[:7] != label:
                continue
            if (job.status or "") in {"quoted", "inquiry"}:
                pipeline += 1
                pipe_rev += flt(job.grand_total)
            else:
                hist += 1
                hist_rev += flt(job.grand_total)
        crew_need = hist  # one crew slot per historical job as a floor
        periods.append(
            {
                "month": label,
                "jobs": hist,
                "pipeline_jobs": pipeline,
                "revenue": _money(hist_rev),
                "pipeline": _money(pipe_rev),
                "crew_need": crew_need,
            }
        )
    prose = complete(f"In two sentences, summarize this booking outlook: {periods}. Do not invent extra numbers.")
    available = bool(prose)
    _log("forecast", "ok" if available else "unavailable", "", int((time.time() - started) * 1000))
    return {
        "available": available,
        "message": prose or UNAVAILABLE,
        "periods": periods,
    }


@frappe.whitelist()
def suggest_dispatch(booking: str | None = None, job: str | None = None) -> dict:
    _entitled()
    _require(DISPATCH_ROLES)
    started = time.time()
    name = booking or job
    if not name:
        frappe.throw("Pick a job.")
    ranked = []
    try:
        from entertainment_express.api.dispatch import list_available_crew

        event_date = frappe.db.get_value("Event Booking", name, "event_date")
        pool = list_available_crew(event_date=str(event_date) if event_date else None) or []
    except Exception:
        pool = []
    for idx, emp in enumerate(pool):
        rate = flt(emp.get("pay_rate"))
        ranked.append(
            {
                "employee": emp.get("employee"),
                "name": emp.get("employee_name"),
                "roles": emp.get("roles") or [],
                "pay": _money(rate),
                "rank": idx + 1,
                "reason": "Available that day" + (f", {', '.join(emp.get('roles') or [])}" if emp.get("roles") else ""),
            }
        )
    ranked.sort(key=lambda r: (r["rank"], r.get("pay") or ""))
    prose = complete(f"In one sentence, suggest staffing this job from: {[r['name'] for r in ranked[:3]]}. Do not mention dollars.")
    available = bool(prose)
    _log("dispatch", "ok" if available else "unavailable", name, int((time.time() - started) * 1000))
    return {
        "available": available,
        "message": prose or UNAVAILABLE,
        "crew": ranked,
        "job": name,
    }


@frappe.whitelist()
def draft_campaign(segment: str | None = None, offer: str | None = None) -> dict:
    _entitled()
    _require(GROW_ROLES)
    started = time.time()
    prompt = (
        f"Draft a short promotional email for this entertainment company. "
        f"List: {segment or 'customers'}. Offer: {offer or 'a thank-you'}. "
        f"No DocType names. Subject plus 3 short paragraphs."
    )
    prose = complete(prompt)
    available = bool(prose)
    _log("draft", "ok" if available else "unavailable", prompt, int((time.time() - started) * 1000))
    subject = "A note from us"
    body = UNAVAILABLE
    if prose:
        lines = [ln.strip() for ln in prose.splitlines() if ln.strip()]
        if lines:
            subject = lines[0].replace("Subject:", "").strip()
            body = "\n".join(lines[1:] or lines)
    return {"available": available, "message": UNAVAILABLE if not available else "", "subject": subject, "body": body}


def _apply_score(lead: str) -> int:
    doc = frappe.get_doc("Lead", lead)
    score = 20
    if getattr(doc, "email_id", None):
        score += 25
    if getattr(doc, "mobile_no", None):
        score += 15
    status = (getattr(doc, "status", None) or "").lower()
    if status in {"open", "replied", "opportunity"}:
        score += 15
    spam = flt(getattr(doc, "ee_spam_score", 0) or 0)
    if spam > 0.5:
        score -= 30
    if getattr(doc, "source", None):
        score += 10
    prose = complete(f"Nudge a 0-100 lead score by at most 10. Current {score}. Email? {bool(doc.email_id)}. Reply with a single integer.")
    if prose:
        digits = "".join(ch for ch in prose if ch.isdigit())
        if digits:
            nudged = int(digits[:3])
            if abs(nudged - score) <= 15:
                score = nudged
    score = max(0, min(100, int(score)))
    if getattr(doc.meta, "has_field", None) and doc.meta.has_field("ee_lead_score"):
        doc.db_set("ee_lead_score", score)
    return score


@frappe.whitelist()
def score_lead(lead: str) -> dict:
    _entitled()
    _require(QUOTE_ROLES)
    started = time.time()
    score = _apply_score(lead)
    _log("score", "ok", lead, int((time.time() - started) * 1000))
    return {"available": True, "score": score, "lead": lead}


def on_lead_insert(doc, method=None) -> None:
    try:
        frappe.enqueue(
            "entertainment_express.api.ai._apply_score",
            lead=doc.name,
            queue="short",
        )
    except Exception:
        try:
            _apply_score(doc.name)
        except Exception:
            pass


@frappe.whitelist()
def confirm(kind: str, payload: dict | str | None = None) -> dict:
    _entitled()
    if isinstance(payload, str):
        payload = frappe.parse_json(payload) or {}
    payload = payload or {}
    started = time.time()
    if kind == "apply_quote":
        _require(QUOTE_ROLES)
        from entertainment_express.api.portal_proposal import save_proposal

        result = save_proposal(
            payload.get("source"),
            payload.get("name"),
            selected=payload.get("selected"),
            deposit_percent=payload.get("deposit_percent") or 25,
        )
        _log("confirm", "ok", kind, int((time.time() - started) * 1000))
        return {"ok": True, "kind": kind, "result": result}
    if kind == "send_reply":
        _require(ASK_ROLES)
        from entertainment_express.notifications import send

        send(
            "assistant_reply",
            payload.get("recipient") or "",
            {"subject": payload.get("subject") or "", "body": payload.get("body") or ""},
        )
        _log("confirm", "ok", kind, int((time.time() - started) * 1000))
        return {"ok": True, "kind": kind}
    if kind == "offer_crew":
        _require(DISPATCH_ROLES)
        from entertainment_express.api.portal_dispatch import offer

        result = offer(payload.get("job") or payload.get("booking"), payload.get("person"), payload.get("role"))
        _log("confirm", "ok", kind, int((time.time() - started) * 1000))
        return {"ok": True, "kind": kind, "result": result}
    frappe.throw("Unknown confirm kind.")


def _ensure_templates() -> None:
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Notification Template"):
        return
    if frappe.db.exists("Notification Template", {"template_key": "assistant_reply"}):
        return
    frappe.get_doc(
        {
            "doctype": "Notification Template",
            "template_key": "assistant_reply",
            "name": "assistant_reply",
            "subject": "{{ subject }}",
            "body_html": "<p>{{ body }}</p>",
            "active": 1,
            "channels": "email",
            "priority": "transactional",
        }
    ).insert(ignore_permissions=True)


def ensure_ai_entitlements() -> None:
    from entertainment_express.setup.seed_plans import _ensure_ai_entitlements

    _ensure_ai_entitlements()
