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

		self._validate_assigned_assets()
		self._ensure_job_costing()

	def _validate_assigned_assets(self):
		if (self.status or "") == "canceled":
			return
		assigned = getattr(self, "assigned_assets", []) or []
		for row in assigned:
			asset_name = getattr(row, "asset", None)
			if not asset_name or not frappe.db.exists("Service Asset", asset_name):
				continue
			asset = frappe.get_doc("Service Asset", asset_name)
			if getattr(asset, "condition_status", None) in ("Quarantined", "In Repair", "Pending Inspection"):
				reason = getattr(asset, "quarantine_reason", None) or asset.condition_status
				frappe.throw(
					f"Asset '{asset.asset_name}' ({asset.name}) is not available for dispatch: {reason}",
					frappe.ValidationError,
				)
			try:
				from entertainment_express.fleet_maintenance.safety import get_asset_safety_certificate_status
				cert_status = get_asset_safety_certificate_status(asset.name, on_date=self.event_date)
				if not cert_status.get("valid"):
					frappe.throw(
						f"Asset '{asset.asset_name}' ({asset.name}) safety gate failed: {cert_status.get('reason')}",
						frappe.ValidationError,
					)
			except Exception as e:
				if isinstance(e, frappe.ValidationError):
					raise e

	def on_submit(self):
		self._ensure_job_costing()

	def on_update(self):
		if getattr(self, "status", None) in ("confirmed", "in_progress", "completed"):
			self._ensure_job_costing()
		if getattr(self, "status", None) == "completed":
			self._record_telemetry()

	def _record_telemetry(self):
		try:
			from entertainment_express.fleet_maintenance.telemetry import increment_asset_usage
			increment_asset_usage(self)
		except Exception as e:
			frappe.log_error(f"Asset telemetry recording failed for {self.name}: {e}", "Event Booking")

	def _ensure_job_costing(self):
		try:
			from entertainment_express.job_costing.provisioning import ensure_event_cost_center_and_project
			ensure_event_cost_center_and_project(self)
		except Exception as e:
			frappe.log_error(f"Job costing provisioning failed for {self.name}: {e}", "Event Booking")

