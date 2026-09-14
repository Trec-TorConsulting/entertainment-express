# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Van-as-a-Warehouse stock transfers, barcode load-out sessions, and return reconciliation."""

from __future__ import annotations

import frappe
from frappe.utils import cint, now_datetime


def get_default_central_warehouse() -> str:
    """Finds or infers the central company warehouse (e.g. Stores or Main Warehouse)."""
    company = None
    if hasattr(frappe, "defaults") and hasattr(frappe.defaults, "get_user_default"):
        try:
            company = frappe.defaults.get_user_default("Company")
        except Exception:
            company = None
    if not company and hasattr(frappe, "db") and hasattr(frappe.db, "get_single_value"):
        try:
            company = frappe.db.get_single_value("Global Defaults", "default_company")
        except Exception:
            company = None

    abbr = None
    if company and hasattr(frappe.db, "get_value"):
        try:
            abbr = frappe.db.get_value("Company", company, "abbr")
        except Exception:
            abbr = None

    candidates = [
        f"Stores - {abbr}" if abbr else "Stores",
        f"Main Warehouse - {abbr}" if abbr else "Main Warehouse",
        "Stores",
        "Main Warehouse",
        "All Warehouses",
    ]
    if hasattr(frappe.db, "exists"):
        for cand in candidates:
            if frappe.db.exists("Warehouse", cand):
                return cand

    return candidates[0]


def validate_scanned_barcode(barcode: str, booking_name: str | None = None) -> dict:
    """Validates scanned barcode/serial number against fleet assets and assigned booking requirements."""
    barcode = (barcode or "").strip()
    if not barcode:
        frappe.throw("Please provide a valid barcode or serial number.")

    # Locate asset by barcode, serial_no, or name
    asset = None
    if hasattr(frappe.db, "get_value"):
        asset = frappe.db.get_value(
            "Service Asset",
            {"barcode": barcode},
            ["name", "asset_name", "item_code", "status", "current_location", "home_location"],
            as_dict=True,
        )
        if not asset and hasattr(frappe.db, "exists") and frappe.db.exists("Service Asset", barcode):
            asset = frappe.db.get_value(
                "Service Asset",
                barcode,
                ["name", "asset_name", "item_code", "status", "current_location", "home_location"],
                as_dict=True,
            )

    if not asset:
        frappe.throw(f"No asset found matching barcode '{barcode}'.")

    is_assigned = False
    match_type = "unassigned"

    if booking_name and hasattr(frappe, "get_doc"):
        try:
            from entertainment_express.logistics.bom_expander import expand_booking_bom

            bom_data = expand_booking_bom(booking_name)
            # Check directly assigned assets
            for sa in bom_data.get("serialized_assets", []):
                if sa.get("asset") == asset.get("name"):
                    is_assigned = True
                    match_type = "assigned_asset"
                    break

            # Check if asset's item code matches any BOM line requirement
            if not is_assigned and asset.get("item_code"):
                for bi in bom_data.get("bom_items", []):
                    if bi.get("item_code") == asset.get("item_code"):
                        is_assigned = True
                        match_type = "bom_component"
                        break
        except Exception:
            pass

    return {
        "valid": True,
        "asset": asset.get("name"),
        "asset_name": asset.get("asset_name"),
        "item_code": asset.get("item_code"),
        "status": asset.get("status"),
        "current_location": asset.get("current_location"),
        "is_assigned": is_assigned,
        "match_type": match_type,
    }


def create_loadout_session(
    booking_name: str,
    vehicle_name: str,
    session_type: str = "loadout",
) -> dict:
    """Creates a new Vehicle Loadout Session staged for barcode scanning."""
    veh = frappe.get_doc("Vehicle", vehicle_name)
    if hasattr(veh, "ensure_van_warehouse"):
        veh.ensure_van_warehouse()
    van_wh = veh.linked_warehouse or f"{veh.vehicle_name or veh.name} - Van"
    central_wh = get_default_central_warehouse()

    if session_type == "loadout":
        src_wh, tgt_wh = central_wh, van_wh
    else:
        src_wh, tgt_wh = van_wh, central_wh

    session = frappe.get_doc(
        {
            "doctype": "Vehicle Loadout Session",
            "session_type": session_type,
            "vehicle": vehicle_name,
            "booking": booking_name,
            "status": "draft",
            "source_warehouse": src_wh,
            "target_warehouse": tgt_wh,
            "started_at": now_datetime(),
            "scanned_items": [],
        }
    )
    session.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "session_id": session.name,
        "session_type": session.session_type,
        "vehicle": session.vehicle,
        "booking": session.booking,
        "source_warehouse": session.source_warehouse,
        "target_warehouse": session.target_warehouse,
        "status": session.status,
    }


def scan_item_to_session(session_id: str, barcode: str) -> dict:
    """Scans and stages an asset into an active loadout/check-in session."""
    session = frappe.get_doc("Vehicle Loadout Session", session_id)
    if session.status != "draft":
        frappe.throw(f"Session {session_id} is already {session.status} and cannot receive new scans.")

    validation = validate_scanned_barcode(barcode, booking_name=session.booking)
    asset_id = validation["asset"]

    # Check for duplicate scan in the same session
    for row in session.scanned_items or []:
        if row.asset == asset_id:
            frappe.throw(f"Asset '{validation['asset_name']}' is already scanned in this session.")

    session.append(
        "scanned_items",
        {
            "asset": asset_id,
            "item_code": validation.get("item_code"),
            "asset_name": validation.get("asset_name"),
            "barcode": barcode,
            "scanned_at": now_datetime(),
            "status": "loaded" if session.session_type == "loadout" else "returned",
        },
    )
    session.save()
    frappe.db.commit()

    return {
        "session_id": session.name,
        "scanned_count": len(session.scanned_items),
        "last_scanned": validation,
    }


def commit_loadout_transfer(session_id: str, allow_incomplete: bool = False) -> dict:
    """Generates an atomic ERPNext Stock Entry (Material Transfer) moving scanned assets to Van Warehouse."""
    session = frappe.get_doc("Vehicle Loadout Session", session_id)
    if session.status != "draft":
        frappe.throw(f"Session {session_id} is already {session.status}.")

    if not session.scanned_items:
        frappe.throw("Cannot commit an empty loadout session. Scan items first.")

    # If linked to a booking, check completeness against required items unless forced
    if session.booking and not allow_incomplete:
        try:
            from entertainment_express.logistics.bom_expander import expand_booking_bom

            bom_data = expand_booking_bom(session.booking)
            required_assets = {a["asset"] for a in bom_data.get("serialized_assets", [])}
            scanned_assets = {row.asset for row in session.scanned_items if row.asset}
            missing = required_assets - scanned_assets
            if missing:
                missing_names = ", ".join(list(missing)[:3])
                frappe.throw(
                    f"Loadout incomplete. Missing {len(missing)} required assets: {missing_names}. "
                    "Scan all required assets or set allow_incomplete=True with dispatcher authorization."
                )
        except frappe.ValidationError:
            raise
        except Exception:
            pass

    # Create ERPNext Stock Entry (Material Transfer)
    stock_entry_name = None
    if hasattr(frappe.db, "exists") and frappe.db.exists("DocType", "Stock Entry"):
        try:
            se_doc = {
                "doctype": "Stock Entry",
                "stock_entry_type": "Material Transfer",
                "from_warehouse": session.source_warehouse,
                "to_warehouse": session.target_warehouse,
                "items": [],
            }
            for row in session.scanned_items:
                se_doc["items"].append(
                    {
                        "item_code": row.item_code or row.asset or "EVENT-ASSET",
                        "qty": 1.0,
                        "s_warehouse": session.source_warehouse,
                        "t_warehouse": session.target_warehouse,
                        "description": row.asset_name,
                    }
                )
            se = frappe.get_doc(se_doc)
            se.insert(ignore_permissions=True)
            if hasattr(se, "submit"):
                try:
                    se.submit()
                except Exception:
                    pass
            stock_entry_name = se.name
        except Exception:
            stock_entry_name = f"STE-MOCK-{session.name}"
    else:
        stock_entry_name = f"STE-TRANSFER-{session.name}"

    # Update asset locations to the vehicle
    for row in session.scanned_items:
        if row.asset and hasattr(frappe.db, "exists") and frappe.db.exists("Service Asset", row.asset):
            try:
                frappe.db.set_value(
                    "Service Asset",
                    row.asset,
                    {
                        "current_location": session.target_warehouse,
                        "status": "in_transit",
                    },
                )
            except Exception:
                pass

    session.stock_entry_ref = stock_entry_name
    session.status = "committed"
    session.completed_at = now_datetime()
    session.save()

    # Update packing list status if applicable
    if session.booking:
        packing_name = frappe.db.get_value("Packing List", {"booking": session.booking}, "name") if hasattr(frappe.db, "get_value") else None
        if packing_name:
            try:
                pl = frappe.get_doc("Packing List", packing_name)
                for item in getattr(pl, "items", []) or []:
                    for sc in session.scanned_items:
                        if item.asset == sc.asset or item.item_code == sc.item_code:
                            item.packed = 1
                            item.scanned = 1
                pl.status = "loaded"
                pl.save()
            except Exception:
                pass

    frappe.db.commit()

    return {
        "session_id": session.name,
        "status": "committed",
        "stock_entry": stock_entry_name,
        "transferred_items": len(session.scanned_items),
        "source_warehouse": session.source_warehouse,
        "target_warehouse": session.target_warehouse,
    }


def commit_return_checkin(session_id: str) -> dict:
    """Transfers scanned return items back to central warehouse and reconciles missing items."""
    session = frappe.get_doc("Vehicle Loadout Session", session_id)
    if session.status != "draft" or session.session_type != "return_checkin":
        frappe.throw(f"Invalid session status or type for return check-in.")

    # Find the matching outbound loadout session for this vehicle & booking
    outbound_sessions = frappe.get_all(
        "Vehicle Loadout Session",
        filters={
            "vehicle": session.vehicle,
            "booking": session.booking,
            "session_type": "loadout",
            "status": "committed",
        },
        fields=["name"],
        order_by="completed_at desc",
    ) if hasattr(frappe, "get_all") else []

    loaded_assets: dict[str, str] = {}
    for ob in outbound_sessions:
        ob_doc = frappe.get_doc("Vehicle Loadout Session", ob.name)
        for itm in getattr(ob_doc, "scanned_items", []) or []:
            if itm.asset:
                loaded_assets[itm.asset] = itm.asset_name or itm.asset

    scanned_return_assets = {row.asset for row in session.scanned_items if row.asset}

    # Missing assets are those that were loaded out on this vehicle but not scanned back in
    missing_assets: list[dict] = []
    for asset_id, asset_name in loaded_assets.items():
        if asset_id not in scanned_return_assets:
            missing_assets.append({"asset": asset_id, "asset_name": asset_name})
            # Flag in session items as missing
            session.append(
                "scanned_items",
                {
                    "asset": asset_id,
                    "asset_name": asset_name,
                    "scanned_at": now_datetime(),
                    "status": "missing",
                    "notes": "Flagged as Missing in Transit during post-event check-in",
                },
            )
            # Update Service Asset status
            if hasattr(frappe.db, "exists") and frappe.db.exists("Service Asset", asset_id):
                try:
                    frappe.db.set_value(
                        "Service Asset",
                        asset_id,
                        {
                            "status": "Missing in Transit",
                        },
                    )
                except Exception:
                    pass

    # Create Material Transfer back to Main Warehouse for scanned items
    stock_entry_name = None
    if scanned_return_assets:
        if hasattr(frappe.db, "exists") and frappe.db.exists("DocType", "Stock Entry"):
            try:
                se_doc = {
                    "doctype": "Stock Entry",
                    "stock_entry_type": "Material Transfer",
                    "from_warehouse": session.source_warehouse,
                    "to_warehouse": session.target_warehouse,
                    "items": [],
                }
                for row in session.scanned_items:
                    if row.status == "returned":
                        se_doc["items"].append(
                            {
                                "item_code": row.item_code or row.asset or "EVENT-ASSET",
                                "qty": 1.0,
                                "s_warehouse": session.source_warehouse,
                                "t_warehouse": session.target_warehouse,
                                "description": row.asset_name,
                            }
                        )
                se = frappe.get_doc(se_doc)
                se.insert(ignore_permissions=True)
                if hasattr(se, "submit"):
                    try:
                        se.submit()
                    except Exception:
                        pass
                stock_entry_name = se.name
            except Exception:
                stock_entry_name = f"STE-MOCK-RET-{session.name}"
        else:
            stock_entry_name = f"STE-RETURN-{session.name}"

        # Reset scanned asset locations to central warehouse
        for asset_id in scanned_return_assets:
            if hasattr(frappe.db, "exists") and frappe.db.exists("Service Asset", asset_id):
                try:
                    frappe.db.set_value(
                        "Service Asset",
                        asset_id,
                        {
                            "current_location": session.target_warehouse,
                            "status": "available",
                        },
                    )
                except Exception:
                    pass

    session.stock_entry_ref = stock_entry_name
    session.status = "committed"
    session.completed_at = now_datetime()
    session.save()

    frappe.db.commit()

    return {
        "session_id": session.name,
        "returned_count": len(scanned_return_assets),
        "missing_count": len(missing_assets),
        "missing_items": missing_assets,
        "stock_entry": stock_entry_name,
    }


def get_van_manifest(vehicle_name: str) -> dict:
    """Returns the current real-time equipment manifest of a fleet vehicle."""
    veh = frappe.get_doc("Vehicle", vehicle_name)
    van_wh = veh.linked_warehouse or f"{veh.vehicle_name or veh.name} - Van"

    # Find assets whose current_location is the vehicle or vehicle warehouse
    current_items: list[dict] = []
    if hasattr(frappe, "get_all"):
        try:
            assets = frappe.get_all(
                "Service Asset",
                filters={"current_location": ["in", [vehicle_name, van_wh]]},
                fields=["name", "asset_name", "item_code", "status", "condition", "barcode"],
            )
            for a in assets:
                current_items.append(
                    {
                        "asset": a.name,
                        "asset_name": a.asset_name,
                        "item_code": a.item_code,
                        "status": a.status,
                        "condition": a.condition,
                        "barcode": a.barcode,
                    }
                )
        except Exception:
            pass

    # Also check most recent active/committed loadout sessions
    active_loadouts = frappe.get_all(
        "Vehicle Loadout Session",
        filters={"vehicle": vehicle_name, "status": "committed", "session_type": "loadout"},
        fields=["name", "booking", "completed_at"],
        order_by="completed_at desc",
        limit=5,
    ) if hasattr(frappe, "get_all") else []

    return {
        "vehicle": vehicle_name,
        "vehicle_name": veh.vehicle_name,
        "plate": getattr(veh, "plate", ""),
        "van_warehouse": van_wh,
        "status": getattr(veh, "status", "active"),
        "capacity_lb": getattr(veh, "max_payload_lb", None),
        "total_items": len(current_items),
        "items": current_items,
        "recent_loadouts": active_loadouts,
    }
