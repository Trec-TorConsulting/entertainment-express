import secrets
import frappe
from frappe.model.document import Document


class EEInteractiveProposal(Document):
    def before_insert(self):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
