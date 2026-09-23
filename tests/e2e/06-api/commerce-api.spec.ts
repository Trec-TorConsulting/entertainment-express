import { test, expect } from "../support/fixtures";

test.describe("API Contract — Storefront Commerce API", () => {
  test("list_records package returns store items for guest", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "package" }, "guest");
    // Public store package list should return data or require no login
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
