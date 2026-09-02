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

    try:
        from entertainment_express.api.safety import inspection_block_reason, sanitization_block_reason

        insp = inspection_block_reason(asset_name, on_date=event_start.date() if hasattr(event_start, "date") else None)
        if insp:
            return {"available": False, "reason": insp, "conflicts": []}
        sanitize = sanitization_block_reason(asset_name)
        if sanitize:
            return {"available": False, "reason": sanitize, "conflicts": []}
    except Exception:
        pass

    if asset.quantity <= 1:
        return _check_unique(asset, window_start, window_end)
    else:
        return _check_pool(asset, window_start, window_end)


def classify(asset_name: str, event_start: datetime, event_end: datetime, exclude_quotation: str | None = None) -> dict:
    """Actual vs potential conflicts. `available` is False only for actual (booking/hold/maintenance)."""
    actual = check(asset_name, event_start, event_end)
    potential = _overlapping_quotations(asset_name, event_start, event_end, exclude_quotation)
    severity = None
    if not actual.get("available"):
        severity = "actual"
    elif potential:
        severity = "potential"
    return {
        "available": bool(actual.get("available")),
        "severity": severity,
        "reason": actual.get("reason") or ("Another open proposal uses this gear" if potential else None),
        "actual": actual.get("conflicts") or [],
        "potential": potential,
    }


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

def _template_sql() -> str:
    try:
        if frappe.get_meta("Event Booking").has_field("is_template"):
            return "AND IFNULL(eb.is_template, 0) = 0"
    except Exception:
        pass
    return ""


def _overlapping_bookings(asset_name: str, window_start, window_end, qty: int) -> list:
    """Return list of booking names that have this asset in the overlap window."""
    results = frappe.db.sql(
        f"""
        SELECT DISTINCT eb.name
        FROM `tabEvent Booking` eb
        JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %(asset)s
          AND eb.status IN ('tentative', 'confirmed', 'in_progress')
          AND eb.docstatus < 2
          {_template_sql()}
          AND TIMESTAMP(eb.event_date, eb.start_time) < %(window_end)s
          AND TIMESTAMP(eb.event_date, eb.end_time)   > %(window_start)s
        """,
        {"asset": asset_name, "window_start": window_start, "window_end": window_end},
        as_dict=True,
    )
    return [r["name"] for r in results]


def _overlapping_booking_qty(asset_name: str, window_start, window_end) -> int:
    result = frappe.db.sql(
        f"""
        SELECT COALESCE(SUM(eba.quantity_reserved), 0) AS total
        FROM `tabEvent Booking` eb
        JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %(asset)s
          AND eb.status IN ('tentative', 'confirmed', 'in_progress')
          AND eb.docstatus < 2
          {_template_sql()}
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


def _overlapping_quotations(asset_name: str, window_start, window_end, exclude_quotation: str | None) -> list:
    """Open/sent quotations that want the same unique gear — potential, not a confirm block."""
    if not frappe.db.table_exists("Quotation") or not frappe.get_meta("Quotation").has_field("ee_event_date"):
        return []
    if not frappe.db.table_exists("Service Asset Linked Item"):
        return []
    params = {
        "asset": asset_name,
        "window_start": window_start,
        "window_end": window_end,
        "exclude": exclude_quotation or "",
    }
    try:
        rows = frappe.db.sql(
            """
            SELECT DISTINCT q.name
            FROM `tabQuotation` q
            JOIN `tabQuotation Item` qi ON qi.parent = q.name
            JOIN `tabService Asset Linked Item` sal ON sal.item = qi.item_code
            WHERE sal.parent = %(asset)s
              AND q.docstatus < 2
              AND IFNULL(q.status, '') IN ('Draft', 'Open', 'Submitted', '')
              AND q.name != %(exclude)s
              AND q.ee_event_date IS NOT NULL
              AND TIMESTAMP(q.ee_event_date, IFNULL(q.ee_event_start, '09:00:00')) < %(window_end)s
              AND TIMESTAMP(q.ee_event_date, IFNULL(q.ee_event_end, '17:00:00')) > %(window_start)s
            """,
            params,
            as_dict=True,
        )
    except Exception:
        return []
    return [r["name"] for r in rows]
