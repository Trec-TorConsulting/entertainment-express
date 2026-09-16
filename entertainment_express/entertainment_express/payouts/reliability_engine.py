# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def calculate_reliability_score(punctuality=100.0, checklist_fidelity=100.0, asset_care=100.0, csat=100.0):
    """
    Evaluates worker reliability rating on a 0-100 scale using 4 weighted vectors:
    R = 0.40*Punctuality + 0.25*ChecklistFidelity + 0.20*AssetCare + 0.15*CSAT
    """
    p = float(punctuality)
    c = float(checklist_fidelity)
    a = float(asset_care)
    s = float(csat)

    r = (0.40 * p) + (0.25 * c) + (0.20 * a) + (0.15 * s)
    return round(max(0.0, min(100.0, r)), 1)


@frappe.whitelist()
def recompute_worker_reliability(worker=None):
    """
    Recomputes reliability score vectors and returns tier status.
    """
    user = worker or frappe.session.user

    # Sample vector ratings
    punctuality = 98.0
    checklist_fidelity = 95.0
    asset_care = 100.0
    csat = 96.0

    score = calculate_reliability_score(punctuality, checklist_fidelity, asset_care, csat)

    tier = "Platinum" if score >= 95.0 else ("Gold" if score >= 88.0 else ("Silver" if score >= 80.0 else "Standard"))

    return {
        "worker": user,
        "reliability_score": score,
        "punctuality_rating": punctuality,
        "checklist_fidelity_rating": checklist_fidelity,
        "asset_care_rating": asset_care,
        "csat_rating": csat,
        "tier": tier
    }
