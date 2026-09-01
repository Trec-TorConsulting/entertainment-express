from types import SimpleNamespace

import pytest

from entertainment_express.api import (
    fleet_ops,
    portal_client,
    portal_collaboration,
    portal_crud,
    portal_dispatch,
    portal_owner,
    portal_proposal,
    portal_reports,
    payments_stripe,
)


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.utils = SimpleNamespace(
            now=lambda: "2026-08-14 12:00:00",
            add_to_date=lambda dt, hours=0, **k: dt,
        )
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            count=lambda *a, **k: 0,
            get_default=lambda *_: "USD",
            set_value=lambda *a, **k: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def logger(self):
        return SimpleNamespace(error=lambda *a, **k: None)


def test_guest_denied_owner_reports(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.owner_pack()


def test_guest_denied_client_money_if_not_customer(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.client_money_summary()


def test_staff_is_booking_member(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], user="owner@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.is_booking_member("EB-1", "owner@test.local") is True


def test_stranger_is_not_member(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.is_booking_member("EB-1", "stranger@test.local") is False


def test_require_member_denies_stranger(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    with pytest.raises(_Perm):
        portal_collaboration.list_messages("EB-1")


def test_list_my_events_guest_without_invites(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.list_my_events() == []


def test_unread_chat_is_zero_without_memberships(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.unread_chat_count() == 0


def test_simple_pdf_bytes():
    raw = portal_reports.simple_pdf("Company reports", ["Jobs: 3", "Billed: $1.00"])
    assert raw.startswith(b"%PDF")
    assert b"%%EOF" in raw


def test_event_guest_role_fixture():
    import json
    from pathlib import Path

    path = Path(__file__).resolve().parents[1] / "fixtures" / "role.json"
    roles = {row["name"] for row in json.loads(path.read_text())}
    assert "EE Event Guest" in roles


def test_owner_crud_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_owner, "frappe", fake)
    with pytest.raises(_Perm):
        portal_crud.list_records("inquiry")


def test_owner_inquiry_schema_is_white_label(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(portal_owner, "frappe", fake)
    schema = portal_crud.describe("inquiry")
    blob = str(schema)
    assert "Lead" not in blob
    assert "DocType" not in blob
    assert "ERPNext" not in blob
    assert schema["kind"] == "inquiry"
    assert schema["can_create"] is True
    assert schema["can_delete"] is True


def test_owner_workspace_schemas_are_white_label(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(portal_owner, "frappe", fake)
    for kind in ("inquiry", "job", "package", "gear", "invoice"):
        blob = str(portal_crud.describe(kind))
        assert "Lead" not in blob
        assert "Sales Invoice" not in blob
        assert "DocType" not in blob
        assert "ERPNext" not in blob


def test_client_pay_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_client, "frappe", fake)
    with pytest.raises(_Perm):
        portal_client.list_invoices()
    with pytest.raises(_Perm):
        portal_client.list_contracts()
    with pytest.raises(_Perm):
        portal_client.start_checkout("SINV-1")


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


def test_proposal_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_proposal, "frappe", fake)
    with pytest.raises(_Perm):
        portal_proposal.get_proposal("inquiry", "LEAD-1")
    with pytest.raises(_Perm):
        portal_proposal.client_proposal("EB-1")


def test_clone_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_owner, "frappe", fake)
    with pytest.raises(_Perm):
        portal_crud.clone_job("EB-1", "2026-09-10")


def test_workflow_steps_are_generic():
    blob = str(portal_proposal.WORKFLOW_STEPS).lower()
    for banned in ("dj", "inflatable", "wedding", "karaoke", "booth"):
        assert banned not in blob


def test_service_item_is_not_a_pull_line(monkeypatch):
    fake = _Fake(["EE Dispatcher"])
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda n: n == "ee_item_type")
    fake.db.get_value = lambda dt, name, field, *a, **k: 1 if field == "is_stock_item" else "service"
    monkeypatch.setattr(fleet_ops, "frappe", fake)
    assert fleet_ops.is_warehouse_line("ITEM-SVC") is False


def test_rental_item_is_a_pull_line(monkeypatch):
    fake = _Fake(["EE Dispatcher"])
    fake.get_meta = lambda *a, **k: SimpleNamespace(has_field=lambda n: True)
    fake.db.get_value = lambda dt, name, field, *a, **k: 0 if field == "is_stock_item" else "rental"
    monkeypatch.setattr(fleet_ops, "frappe", fake)
    assert fleet_ops.is_warehouse_line("ITEM-RENT") is True


def test_dispatch_board_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_dispatch, "frappe", fake)
    with pytest.raises(_Perm):
        portal_dispatch.board()
    with pytest.raises(_Perm):
        portal_dispatch.people()
    with pytest.raises(_Perm):
        portal_dispatch.offer("EB-1", "EMP-1")
    with pytest.raises(_Perm):
        portal_dispatch.my_shifts()


def test_dispatch_board_is_white_label(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.utils.today = lambda: "2026-10-17"
    fake.db.get_value = lambda dt, name, field=None, *a, **k: {
        "event_name": "Smoke Wedding",
        "employee_name": "Pat Crew",
    }.get(field or "", "Pat Crew")
    monkeypatch.setattr(portal_dispatch, "frappe", fake)

    class Core:
        @staticmethod
        def get_dispatch_board(day):
            return [
                {
                    "name": "EB-1",
                    "customer": "Smoke Wedding LLC",
                    "event_name": "Smoke Wedding",
                    "start_time": "2026-10-17 18:00:00",
                    "venue_address": "Hall",
                    "at_risk": True,
                    "crew_assignments": [
                        {"name": "CA-1", "crew_member": "EMP-1", "role": "Field", "status": "offered"}
                    ],
                }
            ]

    monkeypatch.setattr(portal_dispatch, "_dispatch", Core)
    payload = portal_dispatch.board("2026-10-17")
    blob = str(payload)
    assert "Crew Assignment" not in blob
    assert "Event Booking" not in blob
    assert "DocType" not in blob
    assert payload["jobs"][0]["title"] == "Smoke Wedding"
    assert payload["jobs"][0]["crew"][0]["person"] == "Pat Crew"
    assert payload["jobs"][0]["crew"][0]["status"] == "Waiting on them"


def test_field_shifts_denied_for_guest(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_dispatch, "frappe", fake)
    with pytest.raises(_Perm):
        portal_dispatch.check_in("CA-1")
    with pytest.raises(_Perm):
        portal_dispatch.respond("CA-1", "accept")


def test_ensure_employee_for_crew_invite(monkeypatch):
    created = []

    class Doc:
        def __init__(self, data):
            self.__dict__.update(data)
            self.name = data.get("user_id") or data.get("role_name") or "x"

        def insert(self, ignore_permissions=True):
            created.append({k: v for k, v in self.__dict__.items() if k != "name"})
            return self

    fake = _Fake(["EE Tenant Admin"])
    fake.get_doc = lambda data: Doc(data)
    fake.utils.nowdate = lambda: "2026-09-01"
    fake.db.exists = lambda dt, spec: False
    fake.db.table_exists = lambda *_: False
    fake.db.get_default = lambda *_: "EE Smoke Co"
    fake.db.get_single_value = lambda *a: "EE Smoke Co"
    monkeypatch.setattr(portal_owner, "frappe", fake)
    portal_owner.ensure_employee_for_user("crew@test.local", "Pat Crew", ["EE Crew"])
    emp = next(row for row in created if row.get("doctype") == "Employee")
    assert emp["user_id"] == "crew@test.local"
    assert emp["status"] == "Active"
    assert "Field" in emp["ee_crew_roles"]
    created.clear()
    portal_owner.ensure_employee_for_user("office@test.local", "Office Person", ["EE Office"])
    assert not any(row.get("doctype") == "Employee" for row in created)
