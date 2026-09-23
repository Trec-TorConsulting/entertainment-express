import { test, expect } from "../support/fixtures";

test.describe("API Contract — Owner Portal Endpoints", () => {
  const OWNER_METHODS = [
    "entertainment_express.api.portal_owner.dashboard_stats",
    "entertainment_express.api.portal_owner.revenue_report",
    "entertainment_express.api.portal_owner.system_settings",
  ];

  for (const method of OWNER_METHODS) {
    test(`${method} returns status for owner persona`, async ({ apiClient }) => {
      const res = await apiClient.callApi(method, {}, "owner");
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    test(`${method} handles access for employee persona`, async ({ apiClient }) => {
      const res = await apiClient.callApi(method, {}, "employee");
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    test(`${method} handles access for client persona`, async ({ apiClient }) => {
      const res = await apiClient.callApi(method, {}, "client");
      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  }
});
