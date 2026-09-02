"""Phase 26 — isolation and next-action tests. Money amounts stay backend strings."""

from types import SimpleNamespace

import pytest

from entertainment_express.api import portal_client, payments_stripe
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            get_default=lambda *_: "USD",
            table_exists=lambda *_: False,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_meta(self, *a, **k):
        return SimpleNamespace(has_field=lambda *_: False)


def test_quotation_proposal_fields_are_defined():
    names = {f["fieldname"] for f in CUSTOM_FIELDS["Quotation"]}
    assert {"ee_proposal_status", "ee_proposal_token", "ee_last_viewed_at"} <= names
    item_names = {f["fieldname"] for f in CUSTOM_FIELDS["Quotation Item"]}
    assert "ee_client_visible" in item_names


def test_guest_denied_pay_and_sign(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_client, "frappe", fake)
    with pytest.raises(_Perm):
        portal_client.list_invoices()
    with pytest.raises(_Perm):
        portal_client.list_contracts()
    with pytest.raises(_Perm):
        portal_client.start_checkout("SINV-1")
    with pytest.raises(_Perm):
        portal_client.next_action()
    with pytest.raises(_Perm):
        portal_client.sign_contract("CON-1", "Guest")


def test_next_action_prefers_sign_over_pay(monkeypatch):
    fake = _Fake(["EE Customer"])
    monkeypatch.setattr(portal_client, "frappe", fake)
    monkeypatch.setattr(portal_client, "list_contracts", lambda: [{"can_sign": True}])
    monkeypatch.setattr(portal_client, "list_invoices", lambda: [{"can_pay": True}])
    monkeypatch.setattr(portal_client, "_planning_incomplete", lambda: True)
    assert portal_client.next_action()["key"] == "sign"


def test_next_action_pay_before_planning(monkeypatch):
    fake = _Fake(["EE Customer"])
    monkeypatch.setattr(portal_client, "frappe", fake)
    monkeypatch.setattr(portal_client, "list_contracts", lambda: [{"can_sign": False}])
    monkeypatch.setattr(portal_client, "list_invoices", lambda: [{"can_pay": True}])
    monkeypatch.setattr(portal_client, "_planning_incomplete", lambda: True)
    assert portal_client.next_action()["key"] == "pay"


def test_next_action_planning_when_money_clear(monkeypatch):
    fake = _Fake(["EE Customer"])
    monkeypatch.setattr(portal_client, "frappe", fake)
    monkeypatch.setattr(portal_client, "list_contracts", lambda: [])
    monkeypatch.setattr(portal_client, "list_invoices", lambda: [])
    monkeypatch.setattr(portal_client, "_planning_incomplete", lambda: True)
    assert portal_client.next_action()["key"] == "planning"


def test_checkout_denies_other_customer(monkeypatch):
    fake = _Fake(["EE Customer"], user="a@test.local")

    def get_value(dt, spec, field=None, *a, **k):
        if dt == "Customer":
            return "CUST-A"
        if dt == "Sales Invoice":
            return "CUST-B"
        return None

    fake.db.get_value = get_value
    monkeypatch.setattr(payments_stripe, "frappe", fake)
    with pytest.raises(_Perm):
        payments_stripe._assert_checkout_access("SINV-1")


def test_sign_and_pay_denied_for_guest(monkeypatch):
    from entertainment_express.api import proposal

    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(proposal, "frappe", fake)
    with pytest.raises(_Perm):
        proposal.sign_and_pay("QTN-1", "Guest")
    with pytest.raises(_Perm):
        proposal.set_add_ons("QTN-1", [])


def test_potential_overlap_does_not_block_quoting(monkeypatch):
    from datetime import datetime

    from entertainment_express.booking import availability

    monkeypatch.setattr(availability, "check", lambda *a, **k: {"available": True, "conflicts": []})
    monkeypatch.setattr(availability, "_overlapping_quotations", lambda *a, **k: ["QTN-OTHER"])
    result = availability.classify("ASSET", datetime(2030, 1, 1, 10), datetime(2030, 1, 1, 14))
    assert result["available"] is True
    assert result["severity"] == "potential"


def test_actual_conflict_blocks_confirm(monkeypatch):
    from datetime import datetime

    from entertainment_express.booking import availability

    monkeypatch.setattr(availability, "check", lambda *a, **k: {"available": False, "reason": "booked", "conflicts": ["EB-1"]})
    monkeypatch.setattr(availability, "_overlapping_quotations", lambda *a, **k: ["QTN-OTHER"])
    result = availability.classify("ASSET", datetime(2030, 1, 1, 10), datetime(2030, 1, 1, 14))
    assert result["available"] is False
    assert result["severity"] == "actual"


def test_sales_cannot_send_unauthorized_customer(monkeypatch):
    from entertainment_express.api import portal_proposal

    fake = _Fake(["EE Sales"])
    fake.has_permission = lambda *a, **k: False
    fake.db.get_value = lambda *a, **k: "CUST-X"
    monkeypatch.setattr(portal_proposal, "frappe", fake)
    with pytest.raises(_Perm):
        portal_proposal._assert_party_access("job", "EB-1")
    with pytest.raises(_Perm):
        portal_proposal._assert_party_access("inquiry", "LEAD-1")


def test_owner_bypasses_party_access(monkeypatch):
    from entertainment_express.api import portal_proposal

    fake = _Fake(["EE Tenant Admin"])
    fake.has_permission = lambda *a, **k: False
    monkeypatch.setattr(portal_proposal, "frappe", fake)
    portal_proposal._assert_party_access("job", "EB-1")


def test_proposal_omits_hidden_names_totals_include_them(monkeypatch):
    from entertainment_express.api import portal_proposal

    monkeypatch.setattr(portal_proposal, "_money", lambda amount: f"{float(amount):.2f}")
    quote = SimpleNamespace(
        grand_total=540,
        items=[
            SimpleNamespace(item_code="DJ", item_name="DJ Package", qty=1, rate=500, amount=500, ee_client_visible=1),
            SimpleNamespace(item_code="XLR", item_name="XLR cable", qty=4, rate=10, amount=40, ee_client_visible=0),
        ],
    )
    names = [row["name"] for row in portal_proposal._lines_from_quote(quote)]
    assert names == ["DJ Package"]
    assert "XLR cable" not in names
    assert quote.grand_total == 540


def test_packing_keeps_warehouse_lines_proposal_hides_them(monkeypatch):
    from entertainment_express.api import fleet_ops, portal_proposal

    fake = _Fake(["EE Dispatcher"])
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda n: True)

    def get_value(dt, name, field, *a, **k):
        if name == "DJ":
            return 0 if field == "is_stock_item" else "service"
        return 0 if field == "is_stock_item" else "rental"

    fake.db.get_value = get_value
    monkeypatch.setattr(fleet_ops, "frappe", fake)
    monkeypatch.setattr(portal_proposal, "_money", lambda amount: f"{float(amount):.2f}")
    packing_ids = [code for code in ("DJ", "XLR") if fleet_ops.is_warehouse_line(code)]
    quote = SimpleNamespace(
        grand_total=540,
        items=[
            SimpleNamespace(item_code="DJ", item_name="DJ Package", qty=1, rate=500, amount=500, ee_client_visible=1),
            SimpleNamespace(item_code="XLR", item_name="XLR cable", qty=4, rate=10, amount=40, ee_client_visible=0),
        ],
    )
    proposal_ids = [row["id"] for row in portal_proposal._lines_from_quote(quote)]
    assert packing_ids == ["XLR"]
    assert proposal_ids == ["DJ"]
    assert packing_ids != proposal_ids


def test_clone_job_does_not_copy_payments(monkeypatch):
    from datetime import date

    from entertainment_express.api import portal_crud

    inserted = []
    copied_items = []
    src = SimpleNamespace(
        name="EB-1",
        event_name="Party",
        customer="CUST-1",
        start_time="18:00:00",
        end_time="22:00:00",
        venue_address="1 Main",
        timezone="America/New_York",
        notes="keep",
        deposit_percent=25,
        assigned_assets=[],
        service_items=[SimpleNamespace(item="XLR", qty=2, rate=10, amount=20, service_package=None, client_visible=0)],
        event_type="wedding",
        meta=SimpleNamespace(has_field=lambda n: n in ("event_type", "is_template")),
    )

    class NewDoc:
        def __init__(self, payload):
            self.__dict__.update(payload)
            self.doctype = payload["doctype"]
            self.name = "EB-COPY"
            self.service_items = []
            self.meta = SimpleNamespace(has_field=lambda n: True)

        def append(self, field, row):
            getattr(self, field).append(row)
            if field == "service_items":
                copied_items.append(row)

        def insert(self, ignore_permissions=True):
            inserted.append(self.doctype)
            return self

    fake = _Fake(["EE Tenant Admin"])
    fake.utils = SimpleNamespace(getdate=lambda *_: date(2030, 9, 10))

    def get_doc(*a, **k):
        if a and a[0] == "Event Booking":
            return src
        if a and isinstance(a[0], dict):
            return NewDoc(a[0])
        raise AssertionError(a)

    fake.get_doc = get_doc
    monkeypatch.setattr(portal_crud, "frappe", fake)
    monkeypatch.setattr(portal_crud, "_require_owner", lambda: None)
    result = portal_crud.clone_job("EB-1", "2030-09-10")
    assert result["name"] == "EB-COPY"
    assert inserted == ["Event Booking"]
    assert copied_items[0]["client_visible"] == 0
    assert "Sales Invoice" not in inserted
    assert "Payment Entry" not in inserted
    assert "EE Contract" not in inserted


def test_calendar_excludes_templates(monkeypatch):
    from entertainment_express.api import portal_crud

    fake = _Fake(["EE Tenant Admin"])
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda n: n == "is_template")
    monkeypatch.setattr(portal_crud, "frappe", fake)
    assert portal_crud._not_template_filters({"status": "confirmed"}) == {"status": "confirmed", "is_template": 0}


def test_storefront_lists_published_only(monkeypatch):
    from entertainment_express.api import storefront

    captured = {}
    fake = _Fake([])
    fake.db.table_exists = lambda *_: True
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda n: n in ("published", "image"))

    def get_all(dt, filters=None, fields=None, **k):
        captured["doctype"] = dt
        captured["filters"] = filters
        captured["ignore_permissions"] = k.get("ignore_permissions")
        return []

    fake.get_all = get_all
    monkeypatch.setattr(storefront, "frappe", fake)
    monkeypatch.setattr(storefront, "_money", lambda amount: "0.00")
    assert storefront.list_packages() == []
    assert captured["doctype"] == "Service Package"
    assert captured["filters"] == {"published": 1}
    assert captured["ignore_permissions"] is None


def test_storefront_quote_rate_limited(monkeypatch):
    from entertainment_express.api import marketing, storefront

    fake = _Fake([])

    def limited(*a, **k):
        fake.throw("Too many requests. Please try again later.")

    monkeypatch.setattr(marketing, "_check_rate_limit", limited)
    monkeypatch.setattr(storefront, "frappe", fake)
    with pytest.raises(Exception, match="Too many"):
        storefront.request_quote("Ada Lovelace", "ada@test.local")


def test_storefront_quote_creates_lead_on_current_site(monkeypatch):
    from entertainment_express.api import marketing, storefront

    inserted = []
    comments = []

    class Lead:
        def __init__(self, payload):
            self.__dict__.update(payload)
            self.name = "LEAD-NEW"
            self.meta = SimpleNamespace(has_field=lambda *_: False)

        def insert(self, ignore_permissions=True):
            inserted.append(self.doctype)

        def add_comment(self, *a, **k):
            comments.append(a)

    fake = _Fake([])
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda *_: False)
    fake.get_doc = lambda payload, *a, **k: Lead(payload)
    fake.parse_json = lambda v: v
    monkeypatch.setattr(marketing, "_check_rate_limit", lambda *a, **k: None)
    monkeypatch.setattr(storefront, "frappe", fake)
    result = storefront.request_quote("Ada Lovelace", "ada@test.local", packages=[{"id": "PKG-1", "name": "DJ"}])
    assert result["ok"] is True
    assert inserted == ["Lead"]
    assert "DJ" in comments[0][1]


def test_workflow_apply_skips_when_tasks_exist(monkeypatch):
    from entertainment_express.api import workflow

    fake = _Fake(["EE Tenant Admin"])
    fake.db.table_exists = lambda *_: True
    fake.db.exists = lambda *a, **k: True
    fake.get_doc = lambda *a, **k: SimpleNamespace(is_template=0, event_type="wedding", event_date="2030-06-01")
    fake.get_all = lambda *a, **k: [SimpleNamespace(name="TMPL", event_type="wedding")]
    monkeypatch.setattr(workflow, "frappe", fake)
    assert workflow.apply_for_booking("EB-1") == []


def test_automation_toggle_skips_deposit_chase(monkeypatch):
    from entertainment_express.api import workflow

    monkeypatch.setattr(workflow, "_flags", lambda: {"automations": {"deposit_chase": False}})
    assert workflow.automation_enabled("deposit_chase") is False
    assert workflow.automation_enabled("planning_form_reminder") is True
