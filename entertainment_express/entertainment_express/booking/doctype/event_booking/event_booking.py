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

		self._ensure_job_costing()

	def on_submit(self):
		self._ensure_job_costing()

	def on_update(self):
		if getattr(self, "status", None) in ("confirmed", "in_progress", "completed"):
			self._ensure_job_costing()

	def _ensure_job_costing(self):
		try:
			from entertainment_express.job_costing.provisioning import ensure_event_cost_center_and_project
			ensure_event_cost_center_and_project(self)
		except Exception as e:
			frappe.log_error(f"Job costing provisioning failed for {self.name}: {e}", "Event Booking")

