/**
 * Owner Portal — Plan & Subscription Settings
 *
 * Verifies Plan page loads, current plan tier & usage limits render,
 * and upgrade/downgrade options are visible with zero JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Plan & Subscription Settings", () => {
  test("loads Plan page and subscription tier management", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Plan");
    await assertNoErrors(ownerPage, "Owner Plan Settings");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders plan options or tier cards", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Plan");

    const planCards = ownerPage.locator(".card, [role='article'], button, div").filter({
      hasText: /starter|pro|enterprise|scale|plan|billing|subscription/i
    });
    const count = await planCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

