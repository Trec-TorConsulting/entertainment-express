import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Invoices & Billing", () => {
  test("navigates to Invoices view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Invoices");
    await assertShell(ownerPage, "Invoices Page");
  });
});
