# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class EventCostSheet(Document):
    def validate(self):
        self.calculate_totals()

    def calculate_totals(self):
        self.total_cogs = flt(
            flt(self.labor_cost)
            + flt(self.subcontractor_cost)
            + flt(self.consumable_cost)
            + flt(self.equipment_wear_cost)
            + flt(self.gateway_fees),
            2,
        )
        self.net_profit = flt(flt(self.gross_revenue) - flt(self.total_cogs), 2)
        
        gross = flt(self.gross_revenue)
        if gross > 0:
            self.margin_percent = flt((self.net_profit / gross) * 100.0, 2)
        else:
            self.margin_percent = 0.0 if flt(self.total_cogs) == 0 else -100.0

        # Projected financials calculation
        proj_labor = flt(getattr(self, "projected_labor_cost", 0))
        proj_sub = flt(getattr(self, "projected_subcontractor_cost", 0))
        proj_cons = flt(getattr(self, "projected_consumable_cost", 0))
        proj_wear = flt(getattr(self, "projected_equipment_wear", 0))
        proj_gw = flt(getattr(self, "projected_gateway_fees", 0))
        if any([proj_labor, proj_sub, proj_cons, proj_wear, proj_gw]) or getattr(self, "projected_total_cogs", 0):
            self.projected_total_cogs = flt(proj_labor + proj_sub + proj_cons + proj_wear + proj_gw, 2)
            proj_gross = flt(getattr(self, "projected_gross_revenue", 0)) or gross
            self.projected_net_profit = flt(proj_gross - flt(self.projected_total_cogs), 2)
            if proj_gross > 0:
                self.projected_margin_percent = flt((self.projected_net_profit / proj_gross) * 100.0, 2)

        # Margin drift calculation: projected_margin_percent - margin_percent
        proj_margin = getattr(self, "projected_margin_percent", None)
        if proj_margin is not None and (proj_margin > 0 or getattr(self, "projected_total_cogs", 0) > 0):
            self.margin_drift_percent = flt(flt(proj_margin) - flt(self.margin_percent), 2)
        else:
            self.margin_drift_percent = flt(getattr(self, "margin_drift_percent", 0.0), 2)

        target = flt(getattr(self, "target_margin_percent", 40.0)) or 40.0
        low_thresh = 25.0
        drift_thresh = 5.0
        if frappe.db.table_exists("EE Portal Settings"):
            low_thresh = flt(frappe.db.get_single_value("EE Portal Settings", "low_margin_warning_threshold") or 25.0)
            drift_thresh = flt(frappe.db.get_single_value("EE Portal Settings", "margin_drift_warning_threshold") or 5.0)

        if self.margin_percent >= target:
            self.margin_status = "healthy"
        elif self.margin_percent >= low_thresh:
            self.margin_status = "warning"
        else:
            self.margin_status = "critical"

        # If actual margin has drifted negatively beyond threshold, escalate healthy to warning
        if self.margin_drift_percent > drift_thresh and self.margin_status == "healthy":
            self.margin_status = "warning"

