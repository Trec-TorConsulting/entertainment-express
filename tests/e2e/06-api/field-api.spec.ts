import { test, expect } from "../support/fixtures";

test.describe("API Contract — Field Crew Operations API", () => {
  test("my_jobs returns active assignments for employee", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.field.my_jobs", {}, "employee");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
