"""
Placeholder: Multi-tenant isolation tests.

These tests verify that no query, API call, or background job can
leak data across Frappe sites (tenants). Skipped until phase-1 builds
the tenant provisioning + cross-site query guard layer.

Acceptance criteria (phase-1):
- A request authenticated to site A cannot read or write any document on site B.
- frappe.db.sql / get_doc / get_list always scoped to the active site connection.
- Background jobs (frappe.enqueue) execute within the enqueueing site's context.
"""

import pytest


@pytest.mark.skip(reason="Isolation layer implemented in phase-1 — enable then.")
def test_cross_site_document_read_is_blocked():
    """
    WHEN code running in site A's request context attempts to read a document
    from site B's database directly,
    THEN a PermissionError or IsolationError is raised and no data is returned.
    """
    raise AssertionError("Implement in phase-1")


@pytest.mark.skip(reason="Isolation layer implemented in phase-1 — enable then.")
def test_background_job_stays_in_enqueueing_site():
    """
    WHEN a background job is enqueued from site A,
    THEN frappe.local.site inside the job equals site A, not any other tenant site.
    """
    raise AssertionError("Implement in phase-1")


@pytest.mark.skip(reason="Isolation layer implemented in phase-1 — enable then.")
def test_api_key_scoped_to_single_site():
    """
    WHEN an API key issued for site A is used in a request routed to site B,
    THEN the request is rejected with 401/403 and no data is disclosed.
    """
    raise AssertionError("Implement in phase-1")
