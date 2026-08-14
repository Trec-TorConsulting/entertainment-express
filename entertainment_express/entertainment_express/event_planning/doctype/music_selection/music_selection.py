# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document


class MusicSelection(Document):
    def validate(self):
        from entertainment_express.event_planning.music_lib import apply_library_flag
        apply_library_flag(self)

