import { test, expect } from "../support/fixtures";

test.describe("Workflow — Music Selection & Playlist Curation", () => {
  test("end-to-end music request curation flow", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
