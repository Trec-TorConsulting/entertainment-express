import frappe
from frappe.model.document import Document


class Plan(Document):
	def on_update(self):
		if not self.name or getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
			return
		try:
			from entertainment_express.control_plane.entitlements import push_plan_to_site

			tenants = frappe.get_all("Tenant", filters={"plan": self.name}, fields=["name"])
			for t in tenants:
				push_plan_to_site(t.get("name"))
		except Exception as e:
			frappe.log_error(title="Plan on_update error", message=str(e))

