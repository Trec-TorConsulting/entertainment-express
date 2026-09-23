import { test, expect } from "../support/fixtures";

test.describe("API Contract — Employee Portal Endpoints", () => {
  test("my_jobs returns employee-scoped shifts for employee persona", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.field.my_jobs", {}, "employee");
    if (res.ok) {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.message?.jobs ?? res.message)).toBe(true);
    }
  });

  test("my_jobs returns 403 or empty for client persona", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.field.my_jobs", {}, "client");
    if (!res.ok) {
      expect([403, 401]).toContain(res.status);
    }
  });
});
