# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Production BOM expander for live event production kits, sub-assemblies, and pull-sheets."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt


def get_production_bom_for_item(item_code: str) -> str | None:
    """Find the active Production BOM name for a given parent item/package."""
    if not hasattr(frappe, "db") or not hasattr(frappe.db, "get_value"):
        return None
    bom = frappe.db.get_value(
        "Production BOM",
        {"parent_item": item_code, "is_active": 1},
        "name",
    )
    if not bom and frappe.db.exists("Production BOM", item_code):
        return item_code
    return bom


def expand_production_bom(
    bom_identifier: str,
    multiplier: float = 1.0,
    visited: set[str] | None = None,
) -> list[dict]:
    """Recursively expands a Production BOM into a flat list of component requirements."""
    if visited is None:
        visited = set()

    bom_name = get_production_bom_for_item(bom_identifier) or (
        bom_identifier if hasattr(frappe.db, "exists") and frappe.db.exists("Production BOM", bom_identifier) else None
    )
    if not bom_name or bom_name in visited:
        return []

    visited.add(bom_name)
    try:
        bom_doc = frappe.get_doc("Production BOM", bom_name)
    except Exception:
        return []

    results: list[dict] = []
    items = getattr(bom_doc, "items", []) or []

    for item in items:
        item_code = getattr(item, "item_code", "")
        item_name = getattr(item, "item_name", None) or item_code
        item_qty = flt(getattr(item, "qty", 1.0)) * flt(multiplier)
        is_sub = bool(cint(getattr(item, "is_sub_assembly", 0)))
        is_cons = bool(cint(getattr(item, "is_consumable", 0)))
        notes = getattr(item, "notes", "") or ""

        # Line for the component itself
        results.append(
            {
                "parent_bom": bom_name,
                "item_code": item_code,
                "item_name": item_name,
                "qty": item_qty,
                "is_sub_assembly": is_sub,
                "is_consumable": is_cons,
                "notes": notes,
            }
        )

        # If it's a nested sub-assembly, check if it has its own Production BOM
        if is_sub:
            sub_bom = get_production_bom_for_item(item_code)
            if sub_bom and sub_bom not in visited:
                child_expanded = expand_production_bom(
                    sub_bom,
                    multiplier=item_qty,
                    visited=visited,
                )
                results.extend(child_expanded)

    return results


def expand_booking_bom(booking_name: str) -> dict:
    """Expands all package and service items on an Event Booking into a unified production pull-sheet.
    
    Resolves nested sub-assemblies (e.g. sound racks, lighting trusses), loose consumables,
    serialized asset slots, and external sub-rental items.
    """
    if not hasattr(frappe, "get_doc"):
        return {"booking": booking_name, "flat_pull_sheet": [], "bom_items": []}

    try:
        booking = frappe.get_doc("Event Booking", booking_name)
    except Exception:
        return {"booking": booking_name, "flat_pull_sheet": [], "bom_items": []}

    bom_components: list[dict] = []
    visited_boms: set[str] = set()

    # 1. Expand packages / service items
    service_items = getattr(booking, "service_items", []) or []
    for row in service_items:
        item_code = getattr(row, "item", None) or getattr(row, "item_code", "")
        qty = flt(getattr(row, "qty", 1.0))
        if item_code:
            expanded = expand_production_bom(item_code, multiplier=qty, visited=visited_boms)
            if expanded:
                bom_components.extend(expanded)

    assigned_packages = getattr(booking, "assigned_packages", []) or []
    for pkg in assigned_packages:
        pkg_code = getattr(pkg, "package", None) or getattr(pkg, "package_name", "")
        qty = flt(getattr(pkg, "qty", 1.0)) or 1.0
        if pkg_code:
            expanded = expand_production_bom(pkg_code, multiplier=qty, visited=visited_boms)
            if expanded:
                bom_components.extend(expanded)

    # 2. Gather assigned serialized assets
    serialized_assets: list[dict] = []
    for asset_row in getattr(booking, "assigned_assets", []) or []:
        asset_id = getattr(asset_row, "asset", "")
        asset_name = getattr(asset_row, "asset_name", asset_id)
        qty = cint(getattr(asset_row, "quantity_reserved", 1)) or 1
        serialized_assets.append(
            {
                "kind": "asset",
                "asset": asset_id,
                "item_name": asset_name,
                "qty": qty,
            }
        )

    # 3. Gather sub-rentals from Sub Rental Order or legacy Sub Rental
    sub_rentals: list[dict] = []
    if hasattr(frappe, "get_all"):
        try:
            sro_list = frappe.get_all(
                "Sub Rental Order",
                filters={"booking": booking_name, "status": ["!=", "Canceled"]},
                fields=["name", "vendor", "delivery_date", "return_deadline", "status"],
            )
            for sro in sro_list:
                sro_doc = frappe.get_doc("Sub Rental Order", sro.name)
                for item in getattr(sro_doc, "items", []) or []:
                    sub_rentals.append(
                        {
                            "kind": "subrental",
                            "order": sro.name,
                            "vendor": sro.vendor,
                            "item_code": getattr(item, "item_code", ""),
                            "item_name": getattr(item, "item_name", getattr(item, "item_code", "")),
                            "qty": cint(getattr(item, "qty", 1)),
                            "return_deadline": str(sro.return_deadline),
                        }
                    )
        except Exception:
            pass

        # Fallback to legacy Sub Rental DocType if present
        if hasattr(frappe.db, "exists") and frappe.db.exists("DocType", "Sub Rental"):
            try:
                legacy_subs = frappe.get_all(
                    "Sub Rental",
                    filters={"booking": booking_name},
                    fields=["name", "item_name", "qty"],
                )
                for ls in legacy_subs:
                    sub_rentals.append(
                        {
                            "kind": "subrental",
                            "order": ls.name,
                            "item_name": ls.item_name,
                            "qty": cint(ls.qty),
                        }
                    )
            except Exception:
                pass

    # Aggregate flat pull-sheet combining BOM components, serialized assets, and sub-rentals
    flat_pull_sheet: list[dict] = []

    # Map serialized assets
    for sa in serialized_assets:
        flat_pull_sheet.append(
            {
                "kind": "asset",
                "asset": sa["asset"],
                "item_name": sa["item_name"],
                "qty": sa["qty"],
                "source": "assigned_assets",
            }
        )

    # Map BOM components
    for comp in bom_components:
        flat_pull_sheet.append(
            {
                "kind": "subassembly" if comp["is_sub_assembly"] else ("consumable" if comp["is_consumable"] else "asset"),
                "item_code": comp["item_code"],
                "item_name": comp["item_name"],
                "qty": comp["qty"],
                "parent_bom": comp["parent_bom"],
                "notes": comp["notes"],
                "source": "bom_expansion",
            }
        )

    # Map sub-rentals
    for sr in sub_rentals:
        flat_pull_sheet.append(
            {
                "kind": "subrental",
                "item_name": sr["item_name"],
                "item_code": sr.get("item_code"),
                "qty": sr["qty"],
                "vendor": sr.get("vendor"),
                "return_deadline": sr.get("return_deadline"),
                "source": "sub_rental",
            }
        )

    return {
        "booking": booking_name,
        "bom_items": bom_components,
        "sub_assemblies": [c for c in bom_components if c["is_sub_assembly"]],
        "consumables": [c for c in bom_components if c["is_consumable"]],
        "serialized_assets": serialized_assets,
        "sub_rentals": sub_rentals,
        "flat_pull_sheet": flat_pull_sheet,
        "total_items": len(flat_pull_sheet),
    }
