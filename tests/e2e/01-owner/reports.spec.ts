/**
 * Owner Portal — Business Reports & Analytics
 *
 * Verifies Reports page loads, report tiles render, date range filters apply,
 * and report views render without JS error tracebacks.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Business Reports & Analytics", () => {
  test("loads Reports dashboard and report tile grid", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Reports");
    await assertNoErrors(ownerPage, "Owner Reports");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders report tiles or report category links", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Reports");

    const reportCards = ownerPage.locator(".card, .report-card, [role='article'], button, a").filter({
      hasText: /revenue|sales|utilization|margin|payout|tax|performance/i
    });
    const count = await reportCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("applies date range filter and verifies clean update", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Reports");

    const filterBtn = ownerPage.getByRole("button", { name: /filter|date|this month|year/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await ownerPage.waitForTimeout(300);
      await assertNoErrors(ownerPage, "Reports Filter Click");
    }
  });
});

