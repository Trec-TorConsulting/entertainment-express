# Copyright (c) 2024, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SignupApplication(Document):
	def on_trash(self):
		"""Deleting a signup tears down the linked tenant site (if any)."""
		self._enqueue_tenant_teardown()

	def _enqueue_tenant_teardown(self) -> None:
		tenant_name = self.tenant
		if not tenant_name and self.requested_slug:
			tenant_name = frappe.db.get_value(
				"Tenant",
				{"tenant_slug": self.requested_slug, "status": ("not in", ["deleted"])},
				"name",
			)
		if not tenant_name:
			return

		status = frappe.db.get_value("Tenant", tenant_name, "status")
		if status in ("deleted", "deprovisioning"):
			return

		existing = frappe.db.exists(
			"Provisioning Job",
			{
				"tenant": tenant_name,
				"action": "deprovision",
				"state": ("in", ["queued", "running"]),
			},
		)
		if existing:
			return

		frappe.db.set_value("Tenant", tenant_name, "status", "deprovisioning")
		job = frappe.get_doc(
			{
				"doctype": "Provisioning Job",
				"tenant": tenant_name,
				"action": "deprovision",
				"state": "queued",
				"log": f"Queued by Signup Application trash ({self.name})",
			}
		)
		job.insert(ignore_permissions=True)

		from entertainment_express.control_plane.provisioner import enqueue_provision

		enqueue_provision(job.name)
