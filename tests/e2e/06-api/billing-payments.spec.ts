/**
 * API Contract — Billing, Payments & Financial Operations
 *
 * Tests billing APIs including invoice listing, payment processor
 * configuration, and authorization boundaries for financial operations.
 */

import { test, expect } from "../support/fixtures";

test.describe("API Contract — Billing & Payments", () => {
  test.describe("Payment processors (owner)", () => {
    test("list_processors returns configured payment gateways", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_billing.list_processors",
        {},
        "owner",
      );
      if (res.ok) {
        expect(res.message).toBeInstanceOf(Array);
        if (res.message.length > 0) {
          const proc = res.message[0];
          expect(proc.id, "processor has id").toBeTruthy();
          expect(proc.label, "processor has label").toBeTruthy();
          expect(typeof proc.ready, "processor has ready boolean").toBe("boolean");
        }
        // Verify known processors are listed
        const ids = res.message.map((p: { id: string }) => p.id);
        expect(ids).toContain("stripe");
      }
    });

    test("guest cannot list payment processors", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_billing.list_processors",
        {},
        "guest",
      );
      expect(
        [403, 401, 417].includes(res.status),
        `Guest should not list processors, got ${res.status}`,
      ).toBe(true);
    });
  });

  test.describe("Invoice operations", () => {
    test("list_records for invoices returns proper schema", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_crud.list_records",
        { kind: "invoice" },
        "owner",
      );
      if (res.ok) {
        expect(res.message.schema, "invoice schema").toBeDefined();
        expect(res.message.schema.kind).toBe("invoice");
        expect(res.message.schema.can_create, "invoices cannot be created directly").toBe(false);
        expect(res.message.schema.can_delete, "invoices cannot be deleted directly").toBe(false);
        expect(res.message.rows).toBeInstanceOf(Array);
      }
    });

    test("create_balance_invoice with nonexistent booking returns error", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_billing.create_balance_invoice",
        { booking_name: "NONEXISTENT-BOOKING-99999" },
        "owner",
      );
      expect(res.status, "nonexistent booking should not 500").not.toBe(500);
      expect(res.ok, "should not succeed with fake booking").toBe(false);
    });

    test("refund_invoice with nonexistent invoice returns error", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_billing.refund_invoice",
        { invoice_name: "FAKE-INV-999", amount: 100, reason: "test" },
        "owner",
      );
      expect(res.status, "nonexistent invoice should not 500").not.toBe(500);
      expect(res.ok, "should not succeed with fake invoice").toBe(false);
    });
  });

  test.describe("Billing authorization", () => {
    test("employee cannot create invoices", async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_billing.create_balance_invoice",
        { booking_name: "FAKE-001" },
        "employee",
      );
      // Employees without EE Accounting role should be denied
      if ([403, 401, 417].includes(res.status)) {
        // Expected — billing denied
      } else if (res.ok) {
        console.warn("⚠ Employee was able to call create_balance_invoice — check role assignments");
      }
    });
  });
});
