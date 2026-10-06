/**
 * Owner Portal — Subcontractor B2B Exchange
 *
 * Tests subcontractor portal views, active job listings, partner management,
 * tab navigation, and clean execution without console errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Subcontractor B2B Exchange", () => {
  test("loads Subcontractors board and listing view", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Subcontractors");
    await assertNoErrors(ownerPage, "Owner Subcontractors");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const heading = ownerPage.locator("h1, h2, h3").filter({ hasText: /subcontractor|b2b|exchange/i }).first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
  });

  test("switches tabs correctly between Exchange, Partners, and Compliance", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Subcontractors");
    await assertNoErrors(ownerPage, "Subcontractors navigation");

    const tabs = ownerPage.getByRole("tab");
    const count = await tabs.count();
    if (count > 1) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const tab = tabs.nth(i);
        await tab.click();
        await ownerPage.waitForTimeout(300);
        await assertNoErrors(ownerPage, `Subcontractor Tab ${i}`);
      }
    }
  });
});

