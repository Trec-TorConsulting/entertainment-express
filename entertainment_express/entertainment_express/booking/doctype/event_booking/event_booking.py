# Copyright (c) 2024, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EventBooking(Document):
	def validate(self):
		from frappe.utils import get_first_day, get_last_day, today

		if self.is_new() and (self.status or "") != "canceled":
			from entertainment_express.control_plane.entitlements import (
				enforce_numeric_limit,
				has_entitlement,
			)

			limit = has_entitlement("active_bookings_limit")
			if limit is not True and isinstance(limit, int) and limit < 9999:
				active_count = frappe.db.count(
					"Event Booking",
					{
						"event_date": [">=", today()],
						"status": ["not in", ["canceled", "completed"]],
					},
				)
				if active_count >= limit:
					frappe.throw(
						f"Your plan allows up to {limit} active bookings. Upgrade to Pro for unlimited bookings.",
						frappe.ValidationError,
					)

			start = get_first_day(today())
			end = get_last_day(today())
			n = frappe.db.count(
				"Event Booking",
				{"event_date": ["between", [start, end]], "status": ["not in", ["canceled"]]},
			)
			enforce_numeric_limit(
				"max_bookings_per_month",
				n,
				"This month's job limit is reached. Upgrade your plan.",
			)

