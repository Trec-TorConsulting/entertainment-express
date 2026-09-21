import uuid
import frappe
from frappe.model.document import Document


class EEEmbedKey(Document):
    def before_insert(self):
        if not self.api_key:
            self.api_key = f"pk_live_{uuid.uuid4().hex[:24]}"
