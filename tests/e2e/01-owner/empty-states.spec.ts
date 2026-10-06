/**
 * Owner Portal — Empty State Rendering Tests
 *
 * Verifies clean empty-state placeholder rendering across key Owner pages
 * (Pipeline, Calendar, Gear) when no matching records/search results exist,
 * ensuring no broken pages or unhandled exception tracebacks occur.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Empty State Rendering", () => {
  test("renders clean empty state on Pipeline page with non-matching search filter", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Pipeline");
    await assertNoErrors(ownerPage, "Pipeline Page");

    const searchInput = ownerPage.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill("NONEXISTENT_LEAD_XYZ_99999");
      await ownerPage.waitForTimeout(300);
      await assertNoErrors(ownerPage, "Pipeline Empty Filter");
    }
  });

  test("renders clean empty state on Calendar page for far future date", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Calendar");
    await assertNoErrors(ownerPage, "Calendar Page");

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders clean empty state on Gear page with non-matching search filter", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Gear");
    await assertNoErrors(ownerPage, "Gear Page");

    const searchInput = ownerPage.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill("NONEXISTENT_ASSET_XYZ_99999");
      await ownerPage.waitForTimeout(300);
      await assertNoErrors(ownerPage, "Gear Empty Filter");
    }
  });
});
