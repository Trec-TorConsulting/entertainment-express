"""
Availability engine for Event Bookings.

Handles unique asset, pool asset, and buffer-based conflict detection.
All times are naive Python datetime objects in UTC or the site-local timezone;
callers must normalise before passing.

IMPORTANT: Never use this from control-plane code against tenant sites.
           Call only within the tenant's own site context.
"""

import frappe
from datetime import datetime, timedelta


def check(asset_name: str, event_start: datetime, event_end: datetime) -> dict:
    """
    Check whether *asset_name* is available for [event_start, event_end].

    Returns:
        {"available": True}
        {"available": False, "reason": "...", "conflicts": [...]}

    The window checked expands by the asset's linked Item's setup/teardown buffers
    (via the first linked Service Item for that asset).
    """
    asset = frappe.get_doc("Service Asset", asset_name)

    if asset.status != "available":
        return {
            "available": False,
            "reason": f"Asset {asset_name} is not available (status: {asset.status})",
            "conflicts": [],
        }

    setup_buf, teardown_buf = _get_buffers(asset)
    window_start = event_start - timedelta(minutes=setup_buf)
    window_end = event_end + timedelta(minutes=teardown_buf)
    try:
        from entertainment_express.api.fleet_ops import asset_is_blocked

        blocked = asset_is_blocked(asset_name, window_start, window_end)
        if blocked:
            return {"available": False, "reason": blocked, "conflicts": []}
    except Exception:
        pass

    if asset.quantity <= 1:
        return _check_unique(asset, window_start, window_end)
    else:
        return _check_pool(asset, window_start, window_end)


def _get_buffers(asset) -> tuple[int, int]:
    """Return (setup_minutes, teardown_minutes) from the asset's first linked item."""
    if not asset.linked_items:
        return 0, 0
    first_item_name = asset.linked_items[0].item
    if not first_item_name:
        return 0, 0
    setup = frappe.db.get_value("Item", first_item_name, "ee_setup_minutes") or 0
    teardown = frappe.db.get_value("Item", first_item_name, "ee_teardown_minutes") or 0
    return int(setup), int(teardown)


def _check_unique(asset, window_start: datetime, window_end: datetime) -> dict:
    """A unique asset (quantity == 1) conflicts if ANY booking or hold overlaps."""
    booking_conflicts = _overlapping_bookings(asset.name, window_start, window_end, qty=1)
    hold_conflicts = _overlapping_holds(asset.name, window_start, window_end, qty=1)
    all_conflicts = booking_conflicts + hold_conflicts

    if all_conflicts:
        return {
            "available": False,
            "reason": f"Asset {asset.name} already committed for this window",
            "conflicts": all_conflicts,
        }
    return {"available": True}


def _check_pool(asset, window_start: datetime, window_end: datetime) -> dict:
    """
    A pool asset conflicts when total committed >= pool quantity.
    committed = overlapping bookings (sum qty_reserved) + overlapping holds
    """
    booked_qty = _overlapping_booking_qty(asset.name, window_start, window_end)
    held_qty = _overlapping_hold_qty(asset.name, window_start, window_end)
    committed = booked_qty + held_qty

    if committed >= asset.quantity:
        return {
            "available": False,
            "reason": (
                f"Asset pool {asset.name} fully committed ({committed}/{asset.quantity}) "
                "for this window"
            ),
            "conflicts": [],
        }
    return {"available": True, "remaining": asset.quantity - committed}


# ── DB helpers ───────────────────────────────────────────────────────────────

def _overlapping_bookings(asset_name: str, window_start, window_end, qty: int) -> list:
    """Return list of booking names that have this asset in the overlap window."""
    # Event Booking Asset child table rows that reference the asset
    results = frappe.db.sql(
        """
        SELECT DISTINCT eb.name
        FROM `tabEvent Booking` eb
        JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %(asset)s
          AND eb.status IN ('tentative', 'confirmed', 'in_progress')
          AND eb.docstatus < 2
          AND TIMESTAMP(eb.event_date, eb.start_time) < %(window_end)s
          AND TIMESTAMP(eb.event_date, eb.end_time)   > %(window_start)s
        """,
        {"asset": asset_name, "window_start": window_start, "window_end": window_end},
        as_dict=True,
    )
    return [r["name"] for r in results]


def _overlapping_booking_qty(asset_name: str, window_start, window_end) -> int:
    result = frappe.db.sql(
        """
        SELECT COALESCE(SUM(eba.quantity_reserved), 0) AS total
        FROM `tabEvent Booking` eb
        JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %(asset)s
          AND eb.status IN ('tentative', 'confirmed', 'in_progress')
          AND eb.docstatus < 2
          AND TIMESTAMP(eb.event_date, eb.start_time) < %(window_end)s
          AND TIMESTAMP(eb.event_date, eb.end_time)   > %(window_start)s
        """,
        {"asset": asset_name, "window_start": window_start, "window_end": window_end},
        as_dict=True,
    )
    return int(result[0]["total"] if result else 0)


def _overlapping_holds(asset_name: str, window_start, window_end, qty: int) -> list:
    results = frappe.db.sql(
        """
        SELECT DISTINCT h.name
        FROM `tabEvent Booking Hold` h
        JOIN `tabEvent Booking Hold Resource` hr ON hr.parent = h.name
        WHERE hr.asset = %(asset)s
          AND h.converted = 0
          AND h.expires_at > NOW()
          AND h.event_start < %(window_end)s
          AND h.event_end   > %(window_start)s
        """,
        {"asset": asset_name, "window_start": window_start, "window_end": window_end},
        as_dict=True,
    )
    return [r["name"] for r in results]


def _overlapping_hold_qty(asset_name: str, window_start, window_end) -> int:
    result = frappe.db.sql(
        """
        SELECT COALESCE(SUM(hr.quantity_reserved), 0) AS total
        FROM `tabEvent Booking Hold` h
        JOIN `tabEvent Booking Hold Resource` hr ON hr.parent = h.name
        WHERE hr.asset = %(asset)s
          AND h.converted = 0
          AND h.expires_at > NOW()
          AND h.event_start < %(window_end)s
          AND h.event_end   > %(window_start)s
        """,
        {"asset": asset_name, "window_start": window_start, "window_end": window_end},
        as_dict=True,
    )
    return int(result[0]["total"] if result else 0)
