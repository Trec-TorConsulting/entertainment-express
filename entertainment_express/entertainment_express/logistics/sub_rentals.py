# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Sub-rental procurement and return deadline monitoring."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, flt, getdate, nowdate


def create_sub_rental_po(
    booking_id: str,
    vendor_id: str,
    items: list[dict],
    delivery_date: str,
    return_date: str,
    markup_percent: float = 35.0,
    notes: str = "",
) -> dict:
    """Creates a Sub Rental Order and auto-drafts a linked ERPNext Purchase Order."""
    if not items:
        frappe.throw("Sub-rental order must include at least one equipment item.")

    total_cost = 0.0
    order_items = []
    for item in items:
        qty = flt(item.get("qty", 1.0))
        rate = flt(item.get("daily_rate") or item.get("rate") or 0.0)
        days = flt(item.get("days", 1.0))
        item_total = flt(item.get("total_amount") or (qty * rate * days))
        total_cost += item_total
        order_items.append(
            {
                "item_code": item.get("item_code"),
                "item_name": item.get("item_name") or item.get("item_code"),
                "qty": qty,
                "daily_rate": rate,
                "days": days,
                "total_amount": item_total,
                "notes": item.get("notes", ""),
            }
        )

    markup = flt(markup_percent)
    customer_price = total_cost * (1.0 + (markup / 100.0))

    # Draft Sub Rental Order DocType
    sro = frappe.get_doc(
        {
            "doctype": "Sub Rental Order",
            "booking": booking_id,
            "vendor": vendor_id,
            "delivery_date": delivery_date,
            "return_deadline": return_date,
            "total_cost": total_cost,
            "markup_percent": markup,
            "customer_price": customer_price,
            "status": "Draft",
            "notes": notes,
            "items": order_items,
        }
    )
    sro.insert(ignore_permissions=True)

    # Draft ERPNext Purchase Order if available
    po_name = None
    if hasattr(frappe.db, "exists") and frappe.db.exists("DocType", "Purchase Order"):
        try:
            po_doc = {
                "doctype": "Purchase Order",
                "supplier": vendor_id,
                "schedule_date": delivery_date,
                "project": booking_id,
                "items": [
                    {
                        "item_code": itm["item_code"] or "SUB-RENTAL-GEAR",
                        "item_name": itm["item_name"],
                        "qty": itm["qty"],
                        "rate": itm["daily_rate"] * itm["days"] if itm["days"] > 0 else itm["daily_rate"],
                        "schedule_date": delivery_date,
                    }
                    for itm in order_items
                ],
            }
            po = frappe.get_doc(po_doc)
            po.insert(ignore_permissions=True)
            po_name = po.name
            sro.purchase_order_ref = po_name
            sro.save()
        except Exception:
            po_name = f"PO-MOCK-{sro.name}"
            sro.purchase_order_ref = po_name
            sro.save()
    else:
        po_name = f"PO-SUBRENTAL-{sro.name}"
        sro.purchase_order_ref = po_name
        sro.save()

    frappe.db.commit()

    return {
        "sub_rental_order": sro.name,
        "booking": sro.booking,
        "vendor": sro.vendor,
        "total_cost": sro.total_cost,
        "customer_price": sro.customer_price,
        "purchase_order": po_name,
        "status": sro.status,
    }


def check_sub_rental_deadlines() -> list[dict]:
    """Cron task to alert dispatchers 24 hours prior to vendor equipment return deadlines."""
    if not hasattr(frappe, "get_all"):
        return []

    today = getdate(nowdate())
    tomorrow = add_days(today, 1)

    try:
        active_orders = frappe.get_all(
            "Sub Rental Order",
            filters={
                "status": ["in", ["Draft", "Ordered", "Delivered"]],
                "return_deadline": ["<=", str(tomorrow)],
            },
            fields=["name", "booking", "vendor", "return_deadline", "status"],
        )
    except Exception:
        return []

    alerts_sent: list[dict] = []
    for order in active_orders:
        msg = (
            f"Sub-Rental Return Alert: Gear from vendor '{order.vendor}' for booking '{order.booking}' "
            f"is due for return on {order.return_deadline} (within 24 hours). "
            f"Please verify check-in to prevent late supplier fees."
        )
        # Notify dispatchers / admins
        try:
            if hasattr(frappe, "sendmail"):
                frappe.sendmail(
                    recipients=["dispatch@entx.app"],
                    subject=f"Urgent: Sub-Rental Return Due Soon ({order.name})",
                    message=msg,
                )
        except Exception:
            pass

        alerts_sent.append(
            {
                "order": order.name,
                "booking": order.booking,
                "vendor": order.vendor,
                "deadline": str(order.return_deadline),
                "alert": msg,
            }
        )

    return alerts_sent
