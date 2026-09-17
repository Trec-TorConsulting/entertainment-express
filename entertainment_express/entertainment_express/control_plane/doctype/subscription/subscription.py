import frappe
from frappe.model.document import Document


class Subscription(Document):
	def on_update(self):
		if not self.tenant or getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
			return
		try:
			from entertainment_express.control_plane.entitlements import push_plan_to_site

			push_plan_to_site(self.tenant)
		except Exception as e:
			frappe.log_error(title="Subscription on_update error", message=str(e))

