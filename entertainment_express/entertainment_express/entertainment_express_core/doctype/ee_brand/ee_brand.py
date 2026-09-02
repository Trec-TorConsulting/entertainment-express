from frappe.model.document import Document
import re


class EEBrand(Document):
    def validate(self):
        slug = (self.slug or self.brand_name or "brand").strip().lower()
        slug = re.sub(r"[^a-z0-9\-]+", "-", slug).strip("-") or "brand"
        self.slug = slug
