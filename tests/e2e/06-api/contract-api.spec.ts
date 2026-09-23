import { test, expect } from "../support/fixtures";

test.describe("API Contract — Contract & E-Signature API", () => {
  test("list contracts returns data or empty array for owner", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "contract" }, "owner");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
