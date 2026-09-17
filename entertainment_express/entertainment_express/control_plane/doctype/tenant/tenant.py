import frappe
from frappe.model.document import Document
from frappe.utils import flt


class Tenant(Document):
	def on_update(self):
		if not self.name or getattr(frappe.flags, "in_install", False) or getattr(frappe.flags, "in_migrate", False):
			return
		try:
			from entertainment_express.control_plane.entitlements import push_plan_to_site

			if self.plan:
				sub = frappe.db.get_value("Subscription", {"tenant": self.name}, "name")
				if sub:
					price = frappe.db.get_value("Plan", self.plan, "price_monthly") or 0
					frappe.db.set_value("Subscription", sub, {"plan": self.plan, "mrr": flt(price)})
			push_plan_to_site(self.name)
		except Exception as e:
			frappe.log_error(title="Tenant on_update error", message=str(e))

