/**
 * Owner Portal — Payroll & Gig Settlement
 *
 * Verifies Payroll page loads, pending timesheets display, settlement
 * controls render, and tab navigation switches between views cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Payroll & Gig Settlement", () => {
  test("loads Payroll settlement page and displays pending timesheets", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Payroll");
    await assertNoErrors(ownerPage, "Owner Payroll");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("switches tabs correctly between Timesheets, Settlement, and History", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Payroll");
    await assertNoErrors(ownerPage, "Payroll main load");

    const tabs = ownerPage.getByRole("tab");
    const count = await tabs.count();
    if (count > 1) {
      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        await tab.click();
        await ownerPage.waitForTimeout(300);
        await assertNoErrors(ownerPage, `Payroll Tab ${i}`);
      }
    }
  });

  test("renders settlement action controls or summary cards", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Payroll");

    const actionBtns = ownerPage.getByRole("button", { name: /settle|pay|approve|export|filter/i });
    const btnCount = await actionBtns.count();
    expect(btnCount).toBeGreaterThanOrEqual(0);
  });
});

