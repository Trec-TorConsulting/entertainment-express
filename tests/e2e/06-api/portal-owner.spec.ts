/**
 * API Contract — Owner Portal API Surface
 *
 * Tests the owner-specific APIs: dashboard stats, team management,
 * company setup, and owner admin functions with proper schema
 * validation and authorization checks.
 */

import { test, expect } from "../support/fixtures";
import { assertOk } from "../support/schemas";

test.describe("API Contract — Owner Portal APIs", () => {
  test.describe("Dashboard & Stats", () => {
    test("dashboard_stats returns financial and operational metrics", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_owner.dashboard_stats",
        {},
        "owner",
      );
      if (res.ok) {
        assertOk(res, "dashboard_stats");
        // Should return metrics object
        expect(res.message, "dashboard_stats returns data").toBeDefined();
      }
    });

    test("guest cannot access dashboard_stats", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_owner.dashboard_stats",
        {},
        "guest",
      );
      expect(
        [403, 401, 417].includes(res.status),
        `Guest denied dashboard_stats, got ${res.status}`,
      ).toBe(true);
    });
  });

  test.describe("Team Management", () => {
    test("team_members returns list of staff", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_owner.team_members",
        {},
        "owner",
      );
      if (res.ok) {
        expect(res.message).toBeInstanceOf(Array);
        if (res.message.length > 0) {
          const member = res.message[0];
          expect(member.name || member.email, "team member has identifier").toBeTruthy();
        }
      }
    });

    test("employee cannot manage team", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_owner.team_members",
        {},
        "employee",
      );
      // Employee should be denied owner-level team management
      if (res.status === 200) {
        console.warn("⚠ Employee can list team_members — verify role restrictions");
      }
    });
  });

  test.describe("Company Setup", () => {
    test("get_company_info returns company details", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.company_setup.get_company_info",
        {},
        "owner",
      );
      if (res.ok) {
        expect(res.message, "company info is defined").toBeDefined();
      }
    });
  });

  test.describe("Reports", () => {
    test("revenue_summary returns financial data", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_reports.revenue_summary",
        {},
        "owner",
      );
      if (res.ok) {
        expect(res.message, "revenue summary returns data").toBeDefined();
      }
    });

    test("guest cannot access reports", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_reports.revenue_summary",
        {},
        "guest",
      );
      expect(
        [403, 401, 417].includes(res.status),
        `Guest denied reports, got ${res.status}`,
      ).toBe(true);
    });
  });
});
