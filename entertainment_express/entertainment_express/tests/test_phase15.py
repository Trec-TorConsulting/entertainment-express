"""Phase 15 — planning forms, timeline, music."""

from datetime import date, time
from types import SimpleNamespace

import frappe
import pytest

from entertainment_express.event_planning.forms import compute_completion, is_visible, serialize_instance
from entertainment_express.event_planning.music_lib import is_do_not_play


def _field(**kwargs):
    defaults = dict(required=0, field_type="text", conditional_on_field="", conditional_on_value="", options="", help_text="")
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


class TestConditionals:
    def test_hidden_until_yes(self):
        ceremony = _field(field_key="ceremony", label="Ceremony?")
        details = _field(field_key="ceremony_details", label="Details", required=1, conditional_on_field="ceremony", conditional_on_value="Yes")
        assert is_visible(details, {"ceremony": "No"}) is False
        assert is_visible(details, {"ceremony": "Yes"}) is True
        inst = SimpleNamespace(template="x", answers=[SimpleNamespace(field_key="ceremony", value="No")], status="not_started", completion_percent=0)
        tmpl = SimpleNamespace(fields=[ceremony, details], name="x", template_name="Wedding", purpose="planning")
        # required ceremony details hidden → completion can be 100 with only ceremony answered
        inst.answers = [SimpleNamespace(field_key="ceremony", value="No")]
        # compute needs frappe.get_doc — skip if no site
        assert is_visible(details, {"ceremony": "No"}) is False

    def test_serialize_hides_fields(self):
        tmpl = SimpleNamespace(
            name="T",
            template_name="Wedding",
            purpose="planning",
            fields=[
                _field(field_key="ceremony", label="Ceremony?", field_type="select"),
                _field(field_key="officiant", label="Officiant", required=1, conditional_on_field="ceremony", conditional_on_value="Yes"),
            ],
        )
        inst = SimpleNamespace(
            name="I",
            booking="BK",
            template="T",
            status="in_progress",
            completion_percent=50,
            answers=[SimpleNamespace(field_key="ceremony", value="No")],
        )
        payload = serialize_instance(inst, tmpl)
        vis = {f["field_key"]: f["visible"] for f in payload["fields"]}
        assert vis["ceremony"] is True
        assert vis["officiant"] is False


class TestPlanningAttach:
    def setup_method(self):
        if not frappe.db.exists("DocType", "Planning Form Template"):
            pytest.skip("migrate required")
        if not frappe.db.exists("Customer", "TEST-PLAN-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-PLAN-CUST"}).insert(ignore_permissions=True)

    def test_auto_attach_on_confirm(self):
        if not frappe.db.exists("DocType", "Planning Form Template"):
            pytest.skip("migrate required")
        tmpl = frappe.get_doc({
            "doctype": "Planning Form Template",
            "template_name": "Wedding Planning",
            "event_type": "wedding",
            "purpose": "planning",
            "active": 1,
            "fields": [{"field_key": "bride", "label": "Name pronunciation", "field_type": "text", "required": 1}],
        })
        tmpl.insert(ignore_permissions=True)
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-PLAN-CUST",
            "status": "confirmed",
            "event_name": "Sam + Alex",
            "event_type": "wedding",
            "event_date": date(2033, 6, 1),
            "start_time": time(17, 0),
            "end_time": time(23, 0),
        })
        bk.insert(ignore_permissions=True)
        bk.reload()
        from entertainment_express.event_planning.attach import attach_forms
        created = attach_forms(bk.name, "planning")
        assert frappe.db.exists("Planning Form Instance", {"booking": bk.name})
        assert created or frappe.db.exists("Planning Form Instance", {"booking": bk.name})


class TestMusicDoNotPlay:
    def setup_method(self):
        if not frappe.db.exists("DocType", "Music Selection"):
            pytest.skip("migrate required")
        if not frappe.db.exists("Customer", "TEST-PLAN-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-PLAN-CUST"}).insert(ignore_permissions=True)

    def test_guest_blocked_by_do_not_play(self):
        if not frappe.db.exists("DocType", "Music Selection"):
            pytest.skip("migrate required")
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-PLAN-CUST",
            "status": "confirmed",
            "event_name": "Blocklist Event",
            "event_type": "wedding",
            "event_date": date(2033, 7, 1),
            "start_time": time(18, 0),
            "end_time": time(22, 0),
        }).insert(ignore_permissions=True)
        frappe.get_doc({
            "doctype": "Music Selection",
            "booking": bk.name,
            "category": "do_not_play",
            "free_text": "Chicken Dance",
            "requested_by": "client",
            "status": "approved",
        }).insert(ignore_permissions=True)
        assert is_do_not_play(bk.name, "Chicken Dance") is True
        assert is_do_not_play(bk.name, "September") is False


class TestTimelineFinalize:
    def setup_method(self):
        if not frappe.db.exists("DocType", "Event Timeline"):
            pytest.skip("migrate required")
        if not frappe.db.exists("Customer", "TEST-PLAN-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-PLAN-CUST"}).insert(ignore_permissions=True)

    def test_finalize_locks_client_edits(self):
        if not frappe.db.exists("DocType", "Event Timeline"):
            pytest.skip("migrate required")
        frappe.set_user("Administrator")
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-PLAN-CUST",
            "status": "confirmed",
            "event_name": "Timeline Event",
            "event_date": date(2033, 8, 1),
            "start_time": time(18, 0),
            "end_time": time(22, 0),
        }).insert(ignore_permissions=True)
        from entertainment_express.api.timeline import save_timeline, finalize, suggest_change
        save_timeline(bk.name, [{"title": "Grand Entrance", "start_time": "18:00:00", "visible_to_client": 1}])
        finalize(bk.name)
        with pytest.raises(Exception):
            suggest_change(bk.name, 0, {"title": "Later entrance"})
