"""Unit tests and multi-tenant isolation verification for Atomix VirtualDJ Integration & AI Virtual DJ Suite."""

from __future__ import annotations

import inspect
import json
import sys
from types import ModuleType, SimpleNamespace
import pytest

# Ensure frappe mock stub is available when running in standalone pytest
def _setup_frappe_stub():
    if "frappe" not in sys.modules or not hasattr(sys.modules["frappe"], "whitelist"):
        m = ModuleType("frappe")
        m.whitelist = lambda *a, **k: (lambda f: f)
        m.PermissionError = type("PermissionError", (Exception,), {})
        m.ValidationError = type("ValidationError", (ValueError,), {})
        m.DoesNotExistError = type("DoesNotExistError", (KeyError,), {})
        m.throw = lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg))
        m.get_roles = lambda *a, **k: ["EE Tenant Admin"]
        m.session = SimpleNamespace(user="admin@entx.app")
        m.local = SimpleNamespace(site="tenant-alpha.entx.app")
        m.conf = {"secret_key": "site-alpha-secret"}
        m.db = SimpleNamespace()
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})

    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.now_datetime = lambda: "2026-09-11 12:00:00"
    utils.get_datetime = lambda v: v
    utils.get_url = lambda: "https://tenant-alpha.entx.app"
    sys.modules["frappe"].utils = utils
    sys.modules["frappe.utils"] = utils

_setup_frappe_stub()

from entertainment_express.api import virtual_dj as vdj


class _Perm(Exception):
    pass


class _FakeDb:
    def __init__(self, site="tenant-alpha.entx.app"):
        self.site = site
        self.records = {}

    def table_exists(self, table_name):
        return True

    def exists(self, doctype, name):
        if isinstance(name, dict):
            # E.g. {"booking": b, "crew_member": c}
            for doc in self.records.values():
                match = True
                for k, v in name.items():
                    if getattr(doc, k, None) != v and (isinstance(doc, dict) and doc.get(k) != v):
                        match = False
                        break
                if match:
                    return True
            return False
        return name in self.records

    def get_value(self, doctype, name, fieldname=None, as_dict=False):
        doc = self.records.get(name)
        if not doc:
            return None
        if isinstance(doc, dict):
            if as_dict and isinstance(fieldname, list):
                return {f: doc.get(f) for f in fieldname}
            return doc.get(fieldname) if isinstance(fieldname, str) else doc
        if as_dict and isinstance(fieldname, list):
            return {f: getattr(doc, f, None) for f in fieldname}
        return getattr(doc, fieldname, None) if isinstance(fieldname, str) else doc

    def set_value(self, doctype, name, fieldname, value):
        doc = self.records.get(name)
        if doc:
            if isinstance(doc, dict):
                doc[fieldname] = value
            else:
                setattr(doc, fieldname, value)


class _FakeFrappe:
    PermissionError = _Perm

    def __init__(self, roles=None, user="admin@entx.app", site="tenant-alpha.entx.app", secret="site-alpha-secret"):
        self._roles = roles or ["EE Tenant Admin"]
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site=site)
        self.conf = {"secret_key": secret}
        self.db = _FakeDb(site=site)
        self.docs = {}
        self.utils = sys.modules["frappe.utils"]

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or _Perm)(message)

    def get_all(self, doctype, filters=None, fields=None, **kwargs):
        filters = filters or {}
        res = []
        for name, d in self.docs.items():
            if d.get("doctype") != doctype:
                continue
            match = True
            for k, v in filters.items():
                if isinstance(v, list) and len(v) == 2 and v[0] == "in":
                    if d.get(k) not in v[1]:
                        match = False
                        break
                elif d.get(k) != v:
                    match = False
                    break
            if match:
                res.append(d)
        return res

    def get_doc(self, *args, **kwargs):
        if len(args) == 1 and isinstance(args[0], dict):
            d = args[0]
            name = d.get("name") or f"DOC-{len(self.docs) + 1}"
            doc = SimpleNamespace(**d)
            doc.name = name
            doc.save = lambda *a, **k: self.docs.update({name: d})
            doc.insert = lambda *a, **k: self.docs.update({name: d})
            return doc
        elif len(args) >= 2:
            doctype, name = args[0], args[1]
            if name in self.docs:
                d = self.docs[name]
                doc = SimpleNamespace(**d)
                doc.save = lambda *a, **k: self.docs.update({name: doc.__dict__})
                return doc
            doc = SimpleNamespace(name=name, doctype=doctype, status="requested")
            doc.save = lambda *a, **k: self.docs.update({name: doc.__dict__})
            return doc
        return SimpleNamespace(save=lambda *a, **k: None)


# -----------------------------------------------------------------------------
# Section 1 & 2: Live Request Feed & Token Security
# -----------------------------------------------------------------------------

def test_live_token_generation_and_verification(monkeypatch):
    """Test token generation produces secure token, verified correctly on same site."""
    fake = _FakeFrappe(site="alpha.entx.app", secret="secret-123")
    fake.db.records["BK-100"] = {"event_name": "Miller Wedding"}
    monkeypatch.setattr(vdj, "frappe", fake)

    token = vdj.generate_live_token("BK-100")
    assert token.startswith("vdj_BK-100_")

    # Verification on same site succeeds
    verified_booking = vdj.verify_live_token(token)
    assert verified_booking == "BK-100"


def test_live_token_tampering_rejected(monkeypatch):
    """Test tampered tokens or bad signatures are rejected with PermissionError."""
    fake = _FakeFrappe(site="alpha.entx.app", secret="secret-123")
    fake.db.records["BK-100"] = {"event_name": "Miller Wedding"}
    monkeypatch.setattr(vdj, "frappe", fake)

    # Tampered signature
    with pytest.raises(_Perm):
        vdj.verify_live_token("vdj_BK-100_badhash12345678901234")

    # Invalid token prefix
    with pytest.raises(_Perm):
        vdj.verify_live_token("invalid_BK-100_badhash")


def test_get_live_requests_endpoint(monkeypatch):
    """Test get_live_requests returns unplayed approved song requests."""
    fake = _FakeFrappe(site="alpha.entx.app", secret="secret-123")
    fake.db.records["BK-200"] = {"event_name": "Gala 2026"}
    monkeypatch.setattr(vdj, "frappe", fake)
    token = vdj.generate_live_token("BK-200")

    fake.docs["MS-001"] = {
        "doctype": "Music Selection",
        "name": "MS-001",
        "booking": "BK-200",
        "song": "Earth, Wind & Fire - September",
        "category": "must_play",
        "moment": "dancing",
        "status": "approved",
        "requested_by": "client",
        "notes": "Play around 10pm",
    }
    fake.docs["MS-002"] = {
        "doctype": "Music Selection",
        "name": "MS-002",
        "booking": "BK-200",
        "free_text": "Journey - Don't Stop Believin'",
        "category": "general_request",
        "moment": "open floor",
        "status": "requested",
        "requested_by": "guest",
        "requester_name": "Alice",
        "notes": "",
    }

    resp = vdj.get_live_requests(token)
    assert resp["booking"] == "BK-200"
    assert resp["event_name"] == "Gala 2026"
    assert resp["total_requests"] == 2
    assert resp["requests"][0]["title"] == "September"
    assert resp["requests"][0]["artist"] == "Earth, Wind & Fire"
    assert resp["requests"][1]["title"] == "Don't Stop Believin'"
    assert resp["requests"][1]["requester_name"] == "Alice"


def test_acknowledge_request_endpoint(monkeypatch):
    """Test acknowledge_request marks a request as played directly from the feed interface."""
    fake = _FakeFrappe(site="alpha.entx.app", secret="secret-123")
    fake.db.records["BK-200"] = {"event_name": "Gala 2026"}
    fake.db.records["MS-001"] = {"booking": "BK-200", "status": "approved"}
    fake.docs["MS-001"] = {
        "doctype": "Music Selection",
        "name": "MS-001",
        "booking": "BK-200",
        "status": "approved",
    }
    monkeypatch.setattr(vdj, "frappe", fake)
    token = vdj.generate_live_token("BK-200")

    ack = vdj.acknowledge_request(token, "MS-001")
    assert ack["ok"] is True
    assert ack["status"] == "played"
    assert fake.docs["MS-001"]["status"] == "played"

    # Cross-booking acknowledgement rejected
    fake.db.records["MS-OTHER"] = {"booking": "BK-DIFFERENT", "status": "approved"}
    with pytest.raises(_Perm):
        vdj.acknowledge_request(token, "MS-OTHER")


# -----------------------------------------------------------------------------
# Section 3: History Parsing & Fuzzy Reconciliation
# -----------------------------------------------------------------------------

def test_parse_history_log_variations():
    """Test parser on VirtualDJ history.txt formats and XML formats."""
    # 1. Standard history.txt with YYYY/MM/DD HH:MM
    txt1 = """
    2026/09/11 21:15 : Earth, Wind & Fire - September
    2026/09/11 21:19 : Bruno Mars - 24K Magic
    """
    t1 = vdj.parse_history_log(txt1)
    assert len(t1) == 2
    assert t1[0]["artist"] == "Earth, Wind & Fire"
    assert t1[0]["title"] == "September"
    assert "21:15" in t1[0]["timestamp"]

    # 2. Time-only format HH:MM
    txt2 = """
    22:05 : ABBA - Dancing Queen
    """
    t2 = vdj.parse_history_log(txt2)
    assert len(t2) == 1
    assert t2[0]["artist"] == "ABBA"
    assert t2[0]["title"] == "Dancing Queen"
    assert t2[0]["timestamp"] == "22:05"

    # 3. Tab-separated format
    txt3 = "23:00\tThe Beatles\tTwist and Shout"
    t3 = vdj.parse_history_log(txt3)
    assert len(t3) == 1
    assert t3[0]["artist"] == "The Beatles"
    assert t3[0]["title"] == "Twist and Shout"

    # 4. XML format
    xml = """<?xml version="1.0" encoding="UTF-8"?>
    <VirtualFolder Version="8.5">
      <Song FilePath="EE-META/Queen_Don_t_Stop_Me_Now" Title="Don't Stop Me Now" Artist="Queen" PlayTime="2026-09-11 23:30" />
    </VirtualFolder>"""
    t4 = vdj.parse_history_log(xml)
    assert len(t4) == 1
    assert t4[0]["artist"] == "Queen"
    assert t4[0]["title"] == "Don't Stop Me Now"


def test_reconcile_history_flow(monkeypatch):
    """Test history upload fuzzy-matches tracks, updates status to played, and audits."""
    fake = _FakeFrappe(roles=["EE Tenant Admin"])
    fake.db.records["BK-300"] = {"event_name": "Birthday Party"}

    fake.docs["MS-10"] = {
        "doctype": "Music Selection",
        "name": "MS-10",
        "booking": "BK-300",
        "song": "Earth, Wind & Fire - September",
        "status": "approved",
    }
    fake.docs["MS-20"] = {
        "doctype": "Music Selection",
        "name": "MS-20",
        "booking": "BK-300",
        "free_text": "Journey - Don't Stop Believing (Radio Edit)",
        "status": "requested",
    }
    monkeypatch.setattr(vdj, "frappe", fake)

    history_log = """
    21:00 : Earth Wind & Fire - September (12" Disco Mix)
    21:04 : Journey - Don't Stop Believin'
    21:08 : Unknown Artist - Freestyle Beat
    """
    res = vdj.reconcile_history("BK-300", history_log)

    assert res["total_played"] == 3
    assert res["matched_count"] == 2
    assert len(res["unmatched"]) == 1
    assert res["unmatched"][0]["title"] == "Freestyle Beat"

    # Check statuses transitioned
    assert fake.docs["MS-10"]["status"] == "played"
    assert fake.docs["MS-20"]["status"] == "played"


def test_unassigned_crew_permission_rejection(monkeypatch):
    """Test unassigned crew members or guests cannot upload history or generate sets."""
    # Crew member with no assignment
    fake_crew = _FakeFrappe(roles=["EE Crew"], user="unassigned@entx.app")
    fake_crew.db.records["BK-300"] = {"event_name": "Party"}
    # Employee exists but no Crew Assignment
    fake_crew.db.records["EMP-99"] = {"name": "EMP-99", "user_id": "unassigned@entx.app"}
    fake_crew.db.get_value = lambda dt, filters, f=None, **k: "EMP-99" if dt == "Employee" else None
    fake_crew.db.exists = lambda dt, filters: False  # No assignment

    monkeypatch.setattr(vdj, "frappe", fake_crew)

    with pytest.raises(_Perm):
        vdj.reconcile_history("BK-300", "21:00 : Song - Track")

    with pytest.raises(_Perm):
        vdj.generate_ai_set("BK-300")


# -----------------------------------------------------------------------------
# Section 4: AI Virtual DJ Set Curation & Constraints
# -----------------------------------------------------------------------------

def test_generate_ai_set_with_llm(monkeypatch):
    """Test AI set curation enforces do-not-play exclusion and includes must-plays."""
    fake = _FakeFrappe(roles=["EE Tenant Admin"])
    fake.db.records["BK-400"] = {"event_name": "Smith Wedding", "event_type": "Wedding"}

    fake.docs["MP-1"] = {
        "doctype": "Music Selection",
        "name": "MP-1",
        "booking": "BK-400",
        "song": "Etta James - At Last",
        "category": "must_play",
        "moment": "First Dance",
    }
    fake.docs["DNP-1"] = {
        "doctype": "Music Selection",
        "name": "DNP-1",
        "booking": "BK-400",
        "song": "Los Del Rio - Macarena",
        "category": "do_not_play",
    }
    monkeypatch.setattr(vdj, "frappe", fake)

    # Mock LLM returning a JSON tracklist including the prohibited song (testing safety filter)
    mock_llm_json = json.dumps([
        {"title": "September", "artist": "Earth, Wind & Fire", "moment": "Open Dancing", "bpm": 120, "energy": 4, "reason": "Floor filler"},
        {"title": "Macarena", "artist": "Los Del Rio", "moment": "Open Dancing", "bpm": 105, "energy": 3, "reason": "Nostalgia"},
    ])
    monkeypatch.setattr(vdj, "complete", lambda prompt, timeout=18: mock_llm_json)

    res = vdj.generate_ai_set("BK-400", vibe="classic romantic party", target_bpm=120, duration_minutes=60)
    assert res["available"] is True
    track_titles = [t["title"] for t in res["tracks"]]

    # Prohibited Macarena MUST be filtered out
    assert "Macarena" not in track_titles

    # Must-play "At Last" MUST be guaranteed in set
    assert any("At Last" in t for t in track_titles)


def test_generate_ai_set_offline_fallback(monkeypatch):
    """Test AI set curation gracefully degrades to curated lists when LLM is unavailable."""
    fake = _FakeFrappe(roles=["EE Tenant Admin"])
    fake.db.records["BK-500"] = {"event_name": "Corporate Gala", "event_type": "Corporate"}

    fake.docs["MP-2"] = {
        "doctype": "Music Selection",
        "name": "MP-2",
        "booking": "BK-500",
        "song": "Stevie Wonder - Superstition",
        "category": "must_play",
        "moment": "Networking Party",
    }
    monkeypatch.setattr(vdj, "frappe", fake)

    # Mock LLM being offline / returning UNAVAILABLE
    monkeypatch.setattr(vdj, "complete", lambda *a, **k: None)

    res = vdj.generate_ai_set("BK-500", vibe="sophisticated cocktail", target_bpm=115, duration_minutes=90)
    assert res["available"] is False
    assert "AI suggestion unavailable" in res["message"]
    assert len(res["tracks"]) >= 1
    assert any("Superstition" in t["title"] for t in res["tracks"])


# -----------------------------------------------------------------------------
# Section 5: Multi-Tenant Isolation
# -----------------------------------------------------------------------------

def test_virtual_dj_multi_tenant_isolation(monkeypatch):
    """
    Verify tokens, live request feeds, and history logs are strictly site-bound.
    A token from Tenant Alpha MUST NOT grant access on Tenant Beta.
    """
    tenant_a_frappe = _FakeFrappe(site="alpha.entx.app", secret="secret-alpha")
    tenant_b_frappe = _FakeFrappe(site="beta.entx.app", secret="secret-beta")

    # Booking exists on Tenant A
    tenant_a_frappe.db.records["BK-ALPHA"] = {"event_name": "Alpha Event"}
    monkeypatch.setattr(vdj, "frappe", tenant_a_frappe)

    token_a = vdj.generate_live_token("BK-ALPHA")
    assert token_a.startswith("vdj_BK-ALPHA_")

    # Tenant A accesses successfully
    requests_a = vdj.get_live_requests(token_a)
    assert requests_a["booking"] == "BK-ALPHA"

    # Now simulate request sent to Tenant Beta with Tenant A's token
    monkeypatch.setattr(vdj, "frappe", tenant_b_frappe)

    # Verification MUST fail on Tenant Beta because HMAC salt differs
    with pytest.raises(_Perm):
        vdj.get_live_requests(token_a)

    with pytest.raises(_Perm):
        vdj.acknowledge_request(token_a, "MS-001")
