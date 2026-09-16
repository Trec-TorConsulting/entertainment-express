# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe.utils import flt, cint


def estimate_vehicle_transit_cost(
    distance_miles: float = 0.0,
    vehicle_type: str = None,
    mileage_rate: float = None,
) -> float:
    """
    Computes vehicle transit cost using venue distance and tenant fleet mileage rates.
    Defaults to $1.50/mile if not configured in EE Portal Settings or Vehicle.
    """
    if not distance_miles or flt(distance_miles) <= 0:
        return 0.0

    miles = flt(distance_miles)
    rate = flt(mileage_rate) if mileage_rate else None

    if rate is None and hasattr(frappe, "db") and frappe.db.table_exists("EE Portal Settings"):
        val = frappe.db.get_single_value("EE Portal Settings", "fleet_mileage_rate")
        if val:
            rate = flt(val)

    if rate is None or rate <= 0:
        rate = 1.50

    multiplier = 1.0
    if vehicle_type == "box_truck":
        multiplier = 1.35
    elif vehicle_type == "trailer":
        multiplier = 1.15

    return flt(miles * rate * multiplier, 2)


@frappe.whitelist(methods=["GET", "POST"])
def simulate_quote_margin(
    grand_total: float = 0.0,
    packages: list = None,
    crew_roles: list = None,
    distance_miles: float = 0.0,
    sub_rentals: list = None,
    payment_method: str = "card",
    vehicle_transit_cost: float = None,
    equipment_wear_cost: float = None,
    labor_cost: float = None,
    subcontractor_cost: float = None,
    consumable_cost: float = None,
    gateway_fees: float = None,
    target_margin_percent: float = None,
    minimum_margin_floor_percent: float = None,
    **kwargs,
) -> dict:
    """
    Pre-Quote Margin Simulator:
    Forecasts direct COGS (crew wages, vehicle transit/mileage, sub-rentals,
    consumables, equipment wear, and gateway fees) and projects net profit and margin %.
    Validates against the tenant's minimum margin floor and computes recommended price.
    """
    # Parse payload if passed as JSON string
    if isinstance(packages, str):
        try:
            packages = json.loads(packages)
        except Exception:
            packages = []
    if isinstance(crew_roles, str):
        try:
            crew_roles = json.loads(crew_roles)
        except Exception:
            crew_roles = []
    if isinstance(sub_rentals, str):
        try:
            sub_rentals = json.loads(sub_rentals)
        except Exception:
            sub_rentals = []

    gross_revenue = flt(grand_total or kwargs.get("gross_revenue", 0.0))

    # 1. Labor Cost
    calculated_labor = 0.0
    if labor_cost is not None:
        calculated_labor = flt(labor_cost)
    elif kwargs.get("projected_labor") is not None:
        calculated_labor = flt(kwargs.get("projected_labor"))
    elif crew_roles:
        for cr in crew_roles:
            hours = flt(cr.get("hours", 0.0))
            rate = flt(cr.get("rate") or cr.get("hourly_rate", 35.0))
            count = cint(cr.get("count", 1)) or 1
            calculated_labor += flt(hours * rate * count, 2)
    calculated_labor = flt(calculated_labor, 2)

    # 2. Subcontractor Cost
    calculated_sub = 0.0
    if subcontractor_cost is not None:
        calculated_sub = flt(subcontractor_cost)
    elif kwargs.get("projected_subcontractor") is not None:
        calculated_sub = flt(kwargs.get("projected_subcontractor"))
    elif sub_rentals:
        for sr in sub_rentals:
            cost = flt(sr.get("cost") or sr.get("agreed_cost") or sr.get("rate", 0.0))
            qty = cint(sr.get("qty", 1)) or 1
            calculated_sub += flt(cost * qty, 2)
    calculated_sub = flt(calculated_sub, 2)

    # 3. Consumable Cost
    calculated_cons = 0.0
    if consumable_cost is not None:
        calculated_cons = flt(consumable_cost)
    elif kwargs.get("projected_consumable") is not None:
        calculated_cons = flt(kwargs.get("projected_consumable"))
    elif packages:
        for pkg in packages:
            calculated_cons += flt(pkg.get("consumables", 0.0)) * cint(pkg.get("qty", 1) or 1)
    calculated_cons = flt(calculated_cons, 2)

    # 4. Equipment Wear Cost
    calculated_wear = 0.0
    if equipment_wear_cost is not None:
        calculated_wear = flt(equipment_wear_cost)
    elif kwargs.get("projected_equipment_wear") is not None:
        calculated_wear = flt(kwargs.get("projected_equipment_wear"))
    elif packages:
        for pkg in packages:
            wear = flt(pkg.get("equipment_wear", 0.0))
            if wear <= 0 and pkg.get("item_code"):
                wear = 15.0  # Default wear per booked package item
            calculated_wear += wear * cint(pkg.get("qty", 1) or 1)
    calculated_wear = flt(calculated_wear, 2)

    # 5. Vehicle Transit Cost
    calculated_transit = 0.0
    if vehicle_transit_cost is not None:
        calculated_transit = flt(vehicle_transit_cost)
    elif kwargs.get("transit_cost") is not None:
        calculated_transit = flt(kwargs.get("transit_cost"))
    else:
        dist = flt(distance_miles or kwargs.get("distance", 0.0))
        calculated_transit = estimate_vehicle_transit_cost(
            distance_miles=dist,
            vehicle_type=kwargs.get("vehicle_type"),
            mileage_rate=kwargs.get("mileage_rate"),
        )
    calculated_transit = flt(calculated_transit, 2)

    # 6. Payment Gateway Fees
    calculated_gw = 0.0
    if gateway_fees is not None:
        calculated_gw = flt(gateway_fees)
    elif kwargs.get("gateway_fee") is not None:
        calculated_gw = flt(kwargs.get("gateway_fee"))
    elif kwargs.get("projected_gateway_fees") is not None:
        calculated_gw = flt(kwargs.get("projected_gateway_fees"))
    else:
        method = (payment_method or "card").lower()
        if method in ("card", "stripe", "credit_card"):
            calculated_gw = flt(gross_revenue * 0.029 + 0.30, 2) if gross_revenue > 0 else 0.0
        elif method == "ach":
            calculated_gw = min(flt(gross_revenue * 0.008, 2), 5.0) if gross_revenue > 0 else 0.0
        else:
            calculated_gw = 0.0
    calculated_gw = flt(calculated_gw, 2)

    # Total COGS
    total_cogs = flt(
        calculated_labor
        + calculated_sub
        + calculated_cons
        + calculated_wear
        + calculated_transit
        + calculated_gw,
        2,
    )

    net_profit = flt(gross_revenue - total_cogs, 2)
    if gross_revenue > 0:
        projected_margin_percent = flt((net_profit / gross_revenue) * 100.0, 2)
    else:
        projected_margin_percent = 0.0 if total_cogs == 0 else -100.0

    # Tenant settings thresholds
    target_margin = 40.0
    floor_margin = 35.0
    if hasattr(frappe, "db") and frappe.db.table_exists("EE Portal Settings"):
        tm = frappe.db.get_single_value("EE Portal Settings", "default_target_margin_percent")
        if tm:
            target_margin = flt(tm)
        fm = frappe.db.get_single_value("EE Portal Settings", "minimum_margin_floor_percent")
        if fm:
            floor_margin = flt(fm)

    if target_margin_percent is not None:
        target_margin = flt(target_margin_percent)
    if minimum_margin_floor_percent is not None:
        floor_margin = flt(minimum_margin_floor_percent)

    # Evaluate guardrails
    is_below_floor = projected_margin_percent < floor_margin
    override_required = is_below_floor

    if is_below_floor:
        status = "below_floor"
        # Recommended price required to achieve minimum margin floor
        floor_frac = floor_margin / 100.0
        if floor_frac < 1.0:
            recommended_price = flt(total_cogs / (1.0 - floor_frac), 2)
        else:
            recommended_price = gross_revenue
    elif projected_margin_percent < target_margin:
        status = "warning"
        target_frac = target_margin / 100.0
        if target_frac < 1.0:
            recommended_price = flt(total_cogs / (1.0 - target_frac), 2)
        else:
            recommended_price = gross_revenue
    else:
        status = "healthy"
        recommended_price = gross_revenue

    return {
        "gross_revenue": gross_revenue,
        "projected_cogs": {
            "labor": calculated_labor,
            "subcontractor": calculated_sub,
            "consumables": calculated_cons,
            "equipment_wear": calculated_wear,
            "transit": calculated_transit,
            "gateway_fees": calculated_gw,
            "total": total_cogs,
        },
        "projected_total_cogs": total_cogs,
        "projected_net_profit": net_profit,
        "projected_margin_percent": projected_margin_percent,
        "target_margin_percent": target_margin,
        "minimum_margin_floor_percent": floor_margin,
        "is_below_floor": is_below_floor,
        "override_required": override_required,
        "status": status,
        "recommended_price": recommended_price,
    }
