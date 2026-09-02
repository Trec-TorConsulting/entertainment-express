"""Optional DocuSign. Native in-app sign stays the default path."""

from __future__ import annotations

import frappe

from entertainment_express.integrations import observe
from entertainment_express.integrations.credentials import is_enabled, secrets
from entertainment_express.integrations.http import request


def maybe_send(contract_name: str) -> dict | None:
    if not is_enabled("docusign"):
        observe.log_sync("docusign", "send_envelope", "skipped", "EE Contract", contract_name)
        return None
    return observe.run("docusign", "send_envelope", lambda: _send(contract_name), "EE Contract", contract_name)


def _send(contract_name: str) -> dict:
    tok = secrets("docusign")
    access = tok.get("access_token")
    account = tok.get("account_id")
    base = tok.get("base_url") or "https://demo.docusign.net/restapi"
    if not access or not account:
        raise RuntimeError("not connected")
    contract = frappe.get_doc("EE Contract", contract_name)
    body = {
        "emailSubject": f"Please sign {contract_name}",
        "status": "sent",
        "documents": [{"documentId": "1", "name": "agreement.html", "htmlDefinition": {"source": contract.rendered_html or ""}}],
        "recipients": {
            "signers": [{"email": contract.signer_email, "name": contract.signer_name, "recipientId": "1"}]
        },
    }
    out = request("POST", f"{base}/v2.1/accounts/{account}/envelopes", {"Authorization": f"Bearer {access}"}, body)
    env_id = (out or {}).get("envelopeId") if isinstance(out, dict) else None
    if env_id and contract.meta.has_field("docusign_envelope_id"):
        contract.db_set("docusign_envelope_id", env_id)
    return out if isinstance(out, dict) else {"ok": True}


def handle_completed(envelope_id: str) -> None:
    if not envelope_id or not frappe.db.exists("DocType", "EE Contract"):
        return
    name = frappe.db.get_value("EE Contract", {"docusign_envelope_id": envelope_id}, "name")
    if not name:
        return
    status = frappe.db.get_value("EE Contract", name, "status")
    if status == "signed":
        return
    frappe.db.set_value("EE Contract", name, "status", "signed")
