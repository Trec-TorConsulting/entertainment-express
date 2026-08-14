# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document


class PlanningFormInstance(Document):
    def validate(self):
        from entertainment_express.event_planning.forms import compute_completion
        compute_completion(self)

