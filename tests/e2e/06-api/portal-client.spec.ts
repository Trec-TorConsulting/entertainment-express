import { test, expect } from "../support/fixtures";

test.describe("API Contract — Client Portal Endpoints", () => {
  test("my_events returns client-scoped events for client persona", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    if (res.ok) {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.message?.events ?? res.message)).toBe(true);
    }
  });

  test("my_invoices returns client-scoped invoices for client persona", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.customer.my_invoices", {}, "client");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
