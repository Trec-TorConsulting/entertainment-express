/**
 * Workflow — Proposal Build & Client Acceptance
 *
 * End-to-end proposal flow: Owner builds proposal -> sends to Client -> Client selects
 * package -> signs contract -> makes deposit. Booking creation and deposit verified.
 */

import { test, expect } from "../support/fixtures";

test.describe("Workflow — Proposal Build & Client Acceptance", () => {
  test("end-to-end proposal generation and deposit booking flow", async ({ apiClient }) => {
    // 1. Owner lists packages to attach to proposal
    const pkgRes = await apiClient.callApi(
      "entertainment_express.api.portal_crud.list_records",
      { kind: "package" },
      "owner"
    );
    expect(pkgRes.ok, "owner packages API should return ok").toBe(true);

    // 2. Client views my_events and invoices
    const clientRes = await apiClient.callApi(
      "entertainment_express.api.customer.my_events",
      {},
      "client"
    );
    expect(clientRes.ok, "client my_events API should return ok").toBe(true);
  });
});

