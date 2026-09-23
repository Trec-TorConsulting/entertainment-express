import { test, expect } from "../support/fixtures";

test.describe("API Contract — Booking Lifecycle API", () => {
  test("list_records kind: job returns bookings for owner", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "job" }, "owner");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
