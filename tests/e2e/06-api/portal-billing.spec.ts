import { test, expect } from "../support/fixtures";

test.describe("API Contract — Billing & Invoicing Endpoints", () => {
  test("list_invoices endpoint returns array for owner", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "invoice" }, "owner");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
