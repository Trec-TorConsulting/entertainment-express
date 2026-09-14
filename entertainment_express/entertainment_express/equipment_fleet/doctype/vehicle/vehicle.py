import frappe
from frappe.model.document import Document


class Vehicle(Document):
    def validate(self):
        self.ensure_van_warehouse()

    def ensure_van_warehouse(self):
        """Auto-provisions or links an ERPNext child Warehouse under Vehicles group."""
        if self.linked_warehouse:
            return

        company = getattr(self, "company", None)
        abbr = None
        if not company and hasattr(frappe, "defaults") and hasattr(frappe.defaults, "get_user_default"):
            try:
                company = frappe.defaults.get_user_default("Company")
            except Exception:
                company = None
        if not company and hasattr(frappe, "db") and hasattr(frappe.db, "get_single_value"):
            try:
                company = frappe.db.get_single_value("Global Defaults", "default_company")
            except Exception:
                company = None

        if company and hasattr(frappe.db, "get_value"):
            try:
                abbr = frappe.db.get_value("Company", company, "abbr")
            except Exception:
                abbr = None

        name_prefix = self.vehicle_name or self.name or "Van"
        if abbr:
            warehouse_name = f"{name_prefix} - {abbr}"
            parent_wh_name = f"Vehicles - {abbr}"
        else:
            warehouse_name = f"{name_prefix} - Van"
            parent_wh_name = "Vehicles"

        # Auto-create if database supports Warehouse doctype
        if hasattr(frappe, "db") and hasattr(frappe.db, "exists"):
            try:
                if not frappe.db.exists("Warehouse", warehouse_name):
                    # Check or create parent Vehicles group if needed
                    if parent_wh_name and not frappe.db.exists("Warehouse", parent_wh_name):
                        parent_doc = {
                            "doctype": "Warehouse",
                            "warehouse_name": "Vehicles",
                            "name": parent_wh_name,
                            "is_group": 1,
                        }
                        if company:
                            parent_doc["company"] = company
                        try:
                            p_wh = frappe.get_doc(parent_doc)
                            p_wh.insert(ignore_permissions=True)
                        except Exception:
                            pass

                    wh_doc = {
                        "doctype": "Warehouse",
                        "warehouse_name": name_prefix,
                        "name": warehouse_name,
                        "is_group": 0,
                    }
                    if company:
                        wh_doc["company"] = company
                    if parent_wh_name and frappe.db.exists("Warehouse", parent_wh_name):
                        wh_doc["parent_warehouse"] = parent_wh_name

                    wh = frappe.get_doc(wh_doc)
                    wh.insert(ignore_permissions=True)
                    self.linked_warehouse = wh.name or warehouse_name
                else:
                    self.linked_warehouse = warehouse_name
            except Exception:
                self.linked_warehouse = warehouse_name
        else:
            self.linked_warehouse = warehouse_name

