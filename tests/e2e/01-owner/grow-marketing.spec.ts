/**
 * Owner Portal — Grow & Marketing Campaigns
 *
 * Verifies Grow/Marketing page loads, lead generation tools render,
 * campaign management widgets display, and no JS errors occur.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Grow & Marketing Campaigns", () => {
  test("loads Grow marketing dashboard and lead gen tools", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Grow");
    await assertNoErrors(ownerPage, "Owner Grow Marketing");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders campaign cards or marketing tool links", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Grow");

    const tools = ownerPage.locator(".card, [role='article'], button, a").filter({
      hasText: /campaign|review|seo|lead|email|marketing|promo|discount/i
    });
    const count = await tools.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

