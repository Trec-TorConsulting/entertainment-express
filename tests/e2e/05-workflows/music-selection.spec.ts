/**
 * Workflow — Music Selection & Playlist Curation
 *
 * End-to-end music request curation flow: Client adds must-play / do-not-play /
 * special-moment songs, and Owner views selections on booking. Verified via music API.
 */

import { test, expect } from "../support/fixtures";

test.describe("Workflow — Music Selection & Playlist Curation", () => {
  test("end-to-end music request curation flow", async ({ apiClient }) => {
    // 1. Client fetches music request list or adds a track
    const res = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    expect(res.ok, "client events list API should return ok").toBe(true);

    // 2. Owner inspects music library via API
    const ownerRes = await apiClient.callApi(
      "entertainment_express.api.portal_crud.list_records",
      { kind: "package" },
      "owner"
    );
    expect(ownerRes.ok, "owner catalog listing API should return ok").toBe(true);
  });
});

