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

        target = flt(self.target_margin_percent) if flt(self.target_margin_percent) else 40.0
        low_thresh = 25.0
        if frappe.db.table_exists("EE Portal Settings"):
            low_thresh = flt(frappe.db.get_single_value("EE Portal Settings", "low_margin_warning_threshold") or 25.0)

        if self.margin_percent >= target:
            self.margin_status = "healthy"
        elif self.margin_percent >= low_thresh:
            self.margin_status = "warning"
        else:
            self.margin_status = "critical"
