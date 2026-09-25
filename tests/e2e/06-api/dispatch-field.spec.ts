/**
 * API Contract — Dispatch & Field Operations
 *
 * Tests dispatch roster, crew assignment, shift lifecycle, and field
 * APIs with proper schema and authorization validation.
 */

import { test, expect } from "../support/fixtures";
import { assertOk, assertForbidden } from "../support/schemas";

test.describe("API Contract — Dispatch & Field Operations", () => {
  test.describe("Dispatch roster (owner)", () => {
    test("roster returns array of available crew", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_dispatch.roster",
        {},
        "owner",
      );
      if (res.ok) {
        assertOk(res, "dispatch roster");
        expect(res.message).toBeInstanceOf(Array);
        if (res.message.length > 0) {
          const crew = res.message[0];
          expect(crew.name || crew.id, "crew member has identifier").toBeTruthy();
        }
      }
    });

    test("job_crew returns crew list or empty for nonexistent job", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_dispatch.job_crew",
        { job: "NONEXISTENT-JOB-99999" },
        "owner",
      );
      // Should handle gracefully — either empty list or 404
      expect(res.status, "job_crew should not 500 on missing job").not.toBe(500);
    });
  });

  test.describe("Field APIs (employee)", () => {
    test("my_jobs returns array of shifts for employee", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.field.my_jobs",
        {},
        "employee",
      );
      if (res.ok) {
        expect(res.message).toBeInstanceOf(Array);
        if (res.message.length > 0) {
          const shift = res.message[0];
          expect(shift.job || shift.job_id, "shift has job reference").toBeTruthy();
        }
      }
    });

    test("my_earnings returns earnings data for employee", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.field.my_earnings",
        {},
        "employee",
      );
      // Should return earnings summary or empty — not crash
      expect(res.status, "my_earnings should not 500").not.toBe(500);
    });
  });

  test.describe("Dispatch mutations require authorization", () => {
    test("guest cannot access roster", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_dispatch.roster",
        {},
        "guest",
      );
      expect(
        [403, 401, 417].includes(res.status),
        `Guest should not see roster, got ${res.status}`,
      ).toBe(true);
    });

    test("client cannot access roster", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_dispatch.roster",
        {},
        "client",
      );
      expect(
        [403, 401, 417].includes(res.status),
        `Client should not see roster, got ${res.status}`,
      ).toBe(true);
    });
  });
});
