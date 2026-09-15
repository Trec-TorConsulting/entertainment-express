"""Unit tests for AI Owner Out of the Box (Autonomous Operations):
- Emergency Dispatch Copilot & Call-Out Resolution
- Computer Vision Smart Van Eye & Teardown Damage Quarantine
- AI Voice Phone Receptionist & 24/7 Lead Intake
- Dynamic Surge & Yield Pricing Engine
- AI Review Interceptor & Reputation Catalyst
"""

import os
import sys
from types import ModuleType, SimpleNamespace
from datetime import date, datetime
import pytest

repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
app_dir = os.path.join(repo_dir, "entertainment_express")
if repo_dir not in sys.path:
    sys.path.insert(0, repo_dir)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Mock frappe module
if "frappe" in sys.modules:
    mock_frappe = sys.modules["frappe"]
else:
    mock_frappe = ModuleType("frappe")
    sys.modules["frappe"] = mock_frappe

if not hasattr(mock_frappe, "PermissionError"):
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
if not hasattr(mock_frappe, "DoesNotExistError"):
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
if not hasattr(mock_frappe, "ValidationError"):
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})

mock_frappe.get_roles = lambda user=None: ["EE Tenant Admin", "EE Dispatcher", "EE Sales", "EE Marketing"]
mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
mock_frappe.log_error = lambda *a, **k: None
mock_frappe.sendmail = lambda *a, **k: None
mock_frappe.new_doc = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []
mock_frappe.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None, info=lambda *a, **k: None)

mock_session = SimpleNamespace(user="owner@entx.app")
mock_frappe.session = mock_session

mock_db = SimpleNamespace()
mock_db.exists = lambda *a, **k: True
mock_db.get_value = lambda *a, **k: ("EMP-001", "Marcus Vance")
mock_db.get_single_value = lambda *a, **k: "Premier Events LLC"
mock_db.set_value = lambda *a, **k: None
mock_db.commit = lambda: None
mock_db.count = lambda *a, **k: 4
mock_frappe.db = mock_db

mock_defaults = SimpleNamespace()
mock_defaults.get_user_default = lambda key: "Premier Events LLC"
mock_frappe.defaults = mock_defaults

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.nowdate = lambda: "2026-09-15"
mock_utils.getdate = lambda d: datetime.strptime(str(d), "%Y-%m-%d").date() if isinstance(d, str) else d
mock_utils.now_datetime = lambda: datetime(2026, 9, 15, 12, 0, 0)
sys.modules["frappe.utils"] = mock_utils


class MockDoc(SimpleNamespace):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "assigned_crew" not in self.__dict__:
            self.assigned_crew = []
        if "items" not in self.__dict__:
            self.items = []

    def append(self, key, value):
        if not hasattr(self, key):
            setattr(self, key, [])
        if isinstance(value, dict):
            getattr(self, key).append(SimpleNamespace(**value))
        else:
            getattr(self, key).append(value)

    def insert(self, *a, **k):
        return self

    def save(self, *a, **k):
        return self


# Import modules under test
import entertainment_express.api.emergency_dispatch as emergency_dispatch
import entertainment_express.api.vision_van_inspection as vision_inspection
import entertainment_express.api.voice_receptionist as voice_receptionist
import entertainment_express.api.dynamic_pricing as dynamic_pricing
import entertainment_express.api.review_interceptor as review_interceptor


@pytest.fixture(autouse=True)
def setup_mocks(monkeypatch):
    mock_frappe.session.user = "owner@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Tenant Admin", "EE Dispatcher", "EE Sales", "EE Marketing"]

    def mock_new_doc(dt):
        return MockDoc(doctype=dt, name=f"NEW-{dt}", docstatus=0)

    def mock_get_doc(dt, name=None):
        if isinstance(dt, dict):
            return MockDoc(**dt)
        if dt == "Event Booking":
            return MockDoc(
                name=name or "BK-2026-00042",
                customer_name="Alice Johnson",
                event_date="2026-10-17",
                assigned_crew=[SimpleNamespace(employee="EMP-SICK", status="Assigned")]
            )
        if dt == "EE Asset":
            return MockDoc(name=name or "AST-001", status="Operational")
        if dt == "Quotation":
            return MockDoc(name=name or "QTN-001", event_date="2026-10-17", total=1500.0)
        return MockDoc(doctype=dt, name=name or "DOC-001")

    monkeypatch.setattr(mock_frappe, "new_doc", mock_new_doc)
    monkeypatch.setattr(mock_frappe, "get_doc", mock_get_doc)


def test_emergency_dispatch_copilot():
    """Verify emergency call-out handling, worker ranking, broadcast, and YES reply."""
    callout = emergency_dispatch.report_emergency_callout(
        booking_id="BK-2026-00042",
        staff_id="EMP-SICK",
        reason="Severe migraine, unable to DJ"
    )
    assert callout["status"] == "emergency_active"
    assert len(callout["replacement_candidates"]) >= 1

    candidates = emergency_dispatch.find_replacement_candidates("BK-2026-00042", required_role="Lead DJ")
    assert len(candidates) >= 1
    assert candidates[0]["score"] >= 80

    broadcast = emergency_dispatch.broadcast_emergency_offers(
        booking_id="BK-2026-00042",
        bonus_amount=150.0
    )
    assert broadcast["status"] == "broadcast_sent"
    assert broadcast["bonus_amount"] == 150.0

    # Inbound Twilio SMS 'YES' from first responder
    reply = emergency_dispatch.handle_inbound_sms_reply(From="+15551001", Body="YES I CAN TAKE IT")
    assert reply["status"] == "assigned"
    assert "Marcus Vance" in reply["assigned_worker"]


def test_vision_van_inspection():
    """Verify van cargo load-out checklist verification and teardown damage quarantine."""
    # Complete loadout
    loadout = vision_inspection.verify_van_loadout(
        booking_id="BK-2026-00042",
        visible_labels="2x QSC K12.2 Speakers, 1x Subwoofer, 1x DJ Controller Flight Case, 2x Wireless Handheld Mics, 4x XLR Cables, 1x Power Extension Strip"
    )
    assert loadout["is_complete"] is True
    assert loadout["fulfillment_rate"] == 100.0

    # Incomplete loadout (missing wireless mics)
    incomplete = vision_inspection.verify_van_loadout(
        booking_id="BK-2026-00042",
        visible_labels="2x QSC K12.2 Speakers, 1x Subwoofer, 1x DJ Controller Flight Case"
    )
    assert incomplete["is_complete"] is False
    assert len(incomplete["missing_items"]) >= 1

    # Teardown damage inspection
    damage = vision_inspection.inspect_teardown_damage(
        asset_id="AST-INFLATABLE-01",
        booking_id="BK-2026-00042",
        damage_notes="Torn lower seam with visible air leak and scuff marks"
    )
    assert damage["status"] == "damage_quarantined"
    assert damage["asset_quarantined"] is True
    assert damage["security_deposit_hold_flagged"] is True
    assert damage["hold_amount"] == 250.0


def test_voice_receptionist():
    """Verify Twilio voice webhook TwiML generation and SMS proposal dispatch."""
    greeting = voice_receptionist.handle_incoming_call(From="+15559998888")
    assert "<Response>" in greeting
    assert "<Gather" in greeting
    assert "AI event concierge" in greeting

    # Spoken inquiry
    inquiry_twiml = voice_receptionist.process_voice_inquiry(
        caller_phone="+15559998888",
        inquiry_text="Need a wedding DJ and uplighting for October 17th"
    )
    assert "<Response>" in inquiry_twiml
    assert "texted an instant custom quote" in inquiry_twiml

    sms = voice_receptionist.send_caller_proposal_sms("+15559998888")
    assert sms["status"] == "sent"
    assert "https://entx.app/book" in sms["booking_url"]


def test_dynamic_pricing():
    """Verify peak date demand analysis, surge multiplier, and quote recalculation."""
    demand = dynamic_pricing.evaluate_date_demand("2026-10-17")  # October Saturday
    assert demand["is_saturday"] is True
    assert demand["is_peak_season"] is True
    assert demand["surge_multiplier"] >= 1.20
    assert demand["minimum_hours"] >= 4

    pricing = dynamic_pricing.calculate_dynamic_price("2026-10-17", base_price=1000.0)
    assert pricing["surge_multiplier"] >= 1.20
    assert pricing["adjusted_total"] > pricing["base_price"]
    assert pricing["surge_amount"] > 0

    applied = dynamic_pricing.apply_surge_to_quotation("QTN-001")
    assert applied["status"] == "success"
    assert "surge_pricing" in applied


def test_review_interceptor():
    """Verify 5-star Google review promotion vs negative feedback interception and voucher."""
    # 5-Star feedback
    pos = review_interceptor.process_client_feedback(
        booking_id="BK-2026-00042",
        feedback_text="DJ Marcus was absolutely incredible! The dance floor was packed all night long!",
        rating=5
    )
    assert pos["sentiment"] == "Positive"
    assert pos["action"] == "promoted_public_review"
    assert pos["suppressed_public_link"] is False
    assert "g.page" in pos["google_review_url"]
    assert len(pos["suggested_keywords"]) >= 1

    # Negative feedback
    neg = review_interceptor.process_client_feedback(
        booking_id="BK-2026-00042",
        feedback_text="Very disappointed. Music volume was terrible and they arrived late.",
        rating=1
    )
    assert neg["sentiment"] == "Negative"
    assert neg["action"] == "intercepted_internal_escalation"
    assert neg["suppressed_public_link"] is True
    assert neg["critical_owner_alert"] is True
    assert "LOYALTY-CARE-" in neg["voucher_code"]
    assert neg["voucher_amount"] == 100.0
    assert "apology_draft" in neg


def test_multi_tenant_isolation_and_auth():
    """Verify permission barriers across outside-the-box AI APIs."""
    mock_frappe.session.user = "Guest"
    with pytest.raises(mock_frappe.PermissionError):
        emergency_dispatch.find_replacement_candidates("BK-01")
    with pytest.raises(mock_frappe.PermissionError):
        vision_inspection.verify_van_loadout("BK-01")
    with pytest.raises(mock_frappe.PermissionError):
        dynamic_pricing.evaluate_date_demand("2026-10-17")
    with pytest.raises(mock_frappe.PermissionError):
        review_interceptor.analyze_feedback_sentiment("Good")

    # Crew cannot configure dynamic pricing
    mock_frappe.session.user = "crew@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Crew"]
    with pytest.raises(mock_frappe.PermissionError):
        dynamic_pricing.calculate_dynamic_price("2026-10-17", 1000.0)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
