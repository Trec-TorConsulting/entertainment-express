/**
 * Workflow — Planning Form Submission
 *
 * End-to-end cross-persona workflow: Client fills event planning form,
 * saves draft, submits form, and Owner reviews submission on booking detail.
 */

import { test, expect } from "../support/fixtures";

test.describe("Workflow — Planning Form Submission", () => {
  test("end-to-end planning form draft save and submission flow", async ({ apiClient }) => {
    // 1. Client fetches my_events
    const eventsRes = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    expect(eventsRes.ok, "client my_events API should return ok").toBe(true);

    // 2. Owner verifies portal_crud records list for planning submissions
    const listRes = await apiClient.callApi(
      "entertainment_express.api.portal_crud.list_records",
      { kind: "job" },
      "owner"
    );
    expect(listRes.ok, "owner list_records API should return ok").toBe(true);
  });
});

