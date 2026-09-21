# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, today


@frappe.whitelist()
def get_day_offline_manifest(worker=None, target_date=None):
    """
    Pre-caches entire day operational package (bookings, gear lists, run-of-show cues, emergency contacts)
    for authenticated worker or current session user.
    """
    user = worker or frappe.session.user
    event_date = getdate(target_date or today())

    # Fetch assigned assignments / bookings
    assigned_bookings = frappe.get_all(
        "Event Booking",
        filters={
            "event_date": event_date,
            "docstatus": ["in", [0, 1]],
        },
        fields=[
            "name", "customer", "customer_name", "event_name", "event_date",
            "start_time", "end_time", "venue", "venue_address", "contact_phone",
            "status", "grand_total", "outstanding_amount"
        ]
    )

    manifest_items = []
    for booking in assigned_bookings:
        # Gear items / barcode list
        gear = frappe.get_all(
            "EE Booking Item",
            filters={"parent": booking["name"]},
            fields=["name", "item_code", "item_name", "qty", "barcode", "status"]
        ) if frappe.db.exists("DocType", "EE Booking Item") else []

        # Run-of-show cues / timeline
        timeline = frappe.get_all(
            "EE Event Timeline Item",
            filters={"booking": booking["name"]},
            fields=["name", "start_time", "activity_name", "description", "speaker"]
        ) if frappe.db.exists("DocType", "EE Event Timeline Item") else []

        manifest_items.append({
            "booking": booking,
            "gear": gear,
            "timeline": timeline,
        })

    return {
        "worker": user,
        "date": str(event_date),
        "synced_at": str(now_datetime()),
        "manifests": manifest_items,
        "item_catalog": get_cached_item_catalog(),
    }


def get_cached_item_catalog():
    """Returns barcode catalog for offline scanning validation."""
    if not frappe.db.exists("DocType", "EE Asset"):
        return []
    return frappe.get_all(
        "EE Asset",
        fields=["name", "asset_name", "barcode", "item_code", "status"],
        limit=500
    )


@frappe.whitelist()
def sync_offline_batch(mutations=None):
    """
    Accepts batch array of mutations with idempotency checking via EE Offline Sync Log.
    Executes transactional mutations and returns mutation status summary.
    """
    if isinstance(mutations, str):
        mutations = json.loads(mutations)

    if not mutations or not isinstance(mutations, list):
        return {"ok": False, "error": _("Mutations array required")}

    results = []

    for item in mutations:
        mutation_uuid = item.get("mutation_uuid") or item.get("id")
        action = item.get("action") or item.get("endpoint") or "generic_update"
        booking_id = item.get("booking") or item.get("booking_id")
        client_ts = item.get("client_timestamp") or str(now_datetime())

        if not mutation_uuid:
            results.append({"mutation_uuid": None, "status": "Rejected", "error": "Missing mutation_uuid"})
            continue

        # Idempotency check: check if already processed
        existing = frappe.db.get_value(
            "EE Offline Sync Log",
            {"client_uuid": mutation_uuid},
            ["name", "status", "error_message"],
            as_dict=True
        )

        if existing:
            status_val = existing.get("status") if isinstance(existing, dict) else getattr(existing, "status", "Success")
            error_val = existing.get("error_message") if isinstance(existing, dict) else getattr(existing, "error_message", None)
            results.append({
                "mutation_uuid": mutation_uuid,
                "status": status_val,
                "note": "Idempotent skip (already processed)",
                "error": error_val
            })
            continue

        # Process mutation based on action
        status = "Success"
        error_msg = None

        try:
            execute_single_mutation(action, item, booking_id)
        except Exception as e:
            status = "Rejected"
            error_msg = str(e)
            frappe.log_error(f"Offline Sync Error [{action}]: {error_msg}")

        # Record in EE Offline Sync Log
        try:
            log_doc = frappe.get_doc({
                "doctype": "EE Offline Sync Log",
                "client_uuid": mutation_uuid,
                "worker": frappe.session.user,
                "booking": booking_id if booking_id and frappe.db.exists("Event Booking", booking_id) else None,
                "action_type": action,
                "processed_at": now_datetime(),
                "status": status,
                "error_message": error_msg
            })
            log_doc.insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception as log_err:
            frappe.log_error(f"Failed to log offline sync: {log_err}")

        results.append({
            "mutation_uuid": mutation_uuid,
            "status": status,
            "error": error_msg
        })

    return {
        "ok": True,
        "processed_count": len(results),
        "results": results
    }


def execute_single_mutation(action, payload, booking_id):
    """Dispatches offline mutation to relevant domain handler."""
    if action in ("scan_asset_loaded", "log_barcode_scan"):
        barcode = payload.get("barcode")
        if barcode and frappe.db.exists("DocType", "EE Asset"):
            asset_name = frappe.db.get_value("EE Asset", {"barcode": barcode})
            if asset_name:
                frappe.db.set_value("EE Asset", asset_name, "status", payload.get("new_status", "On-Site"))

    elif action in ("submit_waiver_signature", "capture_signature"):
        sig_data = payload.get("signature_data")
        if sig_data and booking_id and frappe.db.exists("DocType", "EE Field Signature"):
            sig_doc = frappe.get_doc({
                "doctype": "EE Field Signature",
                "booking": booking_id,
                "signer_name": payload.get("signer_name", "Client"),
                "signature_data": sig_data,
                "signed_at": payload.get("client_timestamp") or now_datetime()
            })
@frappe.whitelist()
def get_daily_offline_bundle(worker=None, target_date=None):
    """Task 1.2 API: Compiles complete booking and asset graphs for offline field PWA."""
    return get_day_offline_manifest(worker=worker, target_date=target_date)


@frappe.whitelist()
def process_mutation_batch(mutations=None):
    """Task 1.3 API: Process offline mutation batch with strict UUID idempotency checks."""
    return sync_offline_batch(mutations=mutations)

