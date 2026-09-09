# Copyright (c) 2026, Entertainment Express and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class EESubcontractJob(Document):
    def validate(self):
        self.calculate_margins()

    def calculate_margins(self):
        """Compute expected gross margin and margin percentage."""
        # If client_price is not explicitly set, fetch from booking if available
        if not self.client_price and self.booking and frappe.db and frappe.db.exists("Event Booking", self.booking):
            booking_price = frappe.db.get_value("Event Booking", self.booking, "grand_total") or frappe.db.get_value("Event Booking", self.booking, "total_amount")
            if booking_price is not None:
                self.client_price = flt(booking_price)

        client_price = flt(self.client_price)
        agreed_cost = flt(self.agreed_cost)

        # Expected margin = client_price - agreed_cost
        self.expected_margin = flt(client_price - agreed_cost, 2)

        if client_price > 0:
            self.margin_percent = flt((self.expected_margin / client_price) * 100.0, 2)
        else:
            self.margin_percent = 0.0
