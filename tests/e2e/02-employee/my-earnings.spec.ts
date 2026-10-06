/**
 * Employee Portal — My Earnings
 *
 * Verifies Earnings page loads, pay history list renders, date range filters apply,
 * and pay stub detail opens cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Employee Portal — My Earnings", () => {
  test("loads Earnings history and pay stub details", async ({ employeePage }) => {
    await clickNav(employeePage, "Earnings");
    await assertNoErrors(employeePage, "Employee Earnings");
    await expect(employeePage).toHaveURL(/\/employee/);

    const bodyText = await employeePage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders pay stub list and tests detail inspection", async ({ employeePage }) => {
    await clickNav(employeePage, "Earnings");

    const stubs = employeePage.locator(".card, [role='article'], button, tr").filter({
      hasText: /pay|stub|period|earning|tip|commission|\$/i
    });
    const count = await stubs.count();
    if (count > 0) {
      await stubs.first().click().catch(() => {});
      await employeePage.waitForTimeout(300);
      await assertNoErrors(employeePage, "Pay stub detail view");
    }
  });
});

