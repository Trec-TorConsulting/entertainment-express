"""Optional QuickBooks / Xero invoice sync. Skip when disconnected."""

from __future__ import annotations

import frappe
from frappe.utils import flt

from entertainment_express.integrations import observe
from entertainment_express.integrations.credentials import is_enabled, secrets
from entertainment_express.integrations.http import request


def on_invoice_submit(doc, method=None):
    _enqueue(doc.name)


def on_invoice_update(doc, method=None):
    if (doc.status or "").lower() in ("paid", "unpaid", "overdue") or doc.docstatus == 1:
        _enqueue(doc.name)


def _enqueue(invoice_name: str):
    try:
        frappe.enqueue(
            "entertainment_express.integrations.accounting.sync_invoice",
            invoice_name=invoice_name,
            queue="short",
            is_async=True,
        )
    except Exception:
        sync_invoice(invoice_name)


def sync_invoice(invoice_name: str) -> None:
    if not frappe.db.exists("Sales Invoice", invoice_name):
        return
    for provider in ("quickbooks", "xero"):
        if not is_enabled(provider):
            observe.log_sync(provider, "sync_invoice", "skipped", "Sales Invoice", invoice_name)
            continue
        if frappe.db.exists("DocType", "Integration Sync Log"):
            last = frappe.db.get_value(
                "Integration Sync Log",
                {"provider": provider, "action": "sync_invoice", "related_name": invoice_name, "status": "ok"},
                "name",
            )
            if last:
                continue
        observe.run(provider, "sync_invoice", lambda p=provider: _push(p, invoice_name), "Sales Invoice", invoice_name)


def _push(provider: str, invoice_name: str) -> dict:
    tok = secrets(provider)
    access = tok.get("access_token")
    if not access:
        raise RuntimeError("not connected")
    inv = frappe.get_doc("Sales Invoice", invoice_name)
    amount = flt(inv.grand_total)
    if provider == "quickbooks":
        realm = tok.get("realm_id") or ""
        body = {
            "Line": [{"Amount": amount, "DetailType": "SalesItemLineDetail", "Description": invoice_name}],
            "CustomerRef": {"value": "1"},
        }
        out = request(
            "POST",
            f"https://quickbooks.api.intuit.com/v3/company/{realm}/invoice",
            {"Authorization": f"Bearer {access}", "Accept": "application/json"},
            body,
        )
        _store_accounting_id(inv, out)
        return out
    body = {
        "Type": "ACCREC",
        "Contact": {"Name": inv.customer},
        "LineItems": [{"Description": invoice_name, "LineAmount": amount}],
    }
    out = request("POST", "https://api.xero.com/api.xro/2.0/Invoices", {"Authorization": f"Bearer {access}"}, body)
    _store_accounting_id(inv, out)
    return out


def _store_accounting_id(inv, out) -> None:
    if not isinstance(out, dict):
        return
    acct_id = out.get("Id") or out.get("id")
    nested = out.get("Invoice")
    if not acct_id and isinstance(nested, dict):
        acct_id = nested.get("Id") or nested.get("InvoiceID")
    rows = out.get("Invoices")
    if not acct_id and isinstance(rows, list) and rows:
        acct_id = rows[0].get("InvoiceID") or rows[0].get("Id")
    if not acct_id:
        return
    if getattr(getattr(inv, "meta", None), "has_field", lambda *_: False)("ee_accounting_id"):
        inv.db_set("ee_accounting_id", str(acct_id))
