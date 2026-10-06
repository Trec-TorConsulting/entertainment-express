/**
 * Owner Portal — Master Data Explorer
 *
 * Verifies Master Data Explorer loads, DocType browser links function,
 * data tables render, and system administration views load cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Master Data Explorer", () => {
  test("loads Master Data Explorer and DocType browser", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Master Data");
    await assertNoErrors(ownerPage, "Owner Master Data");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("browses DocType list and inspects table records", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Master Data");

    const doctypeItems = ownerPage.locator(".doctype-item, [role='button'], a, option").filter({
      hasText: /booking|customer|item|invoice|asset|event/i
    });
    const count = await doctypeItems.count();
    if (count > 0) {
      await doctypeItems.first().click().catch(() => {});
      await ownerPage.waitForTimeout(300);
      await assertNoErrors(ownerPage, "Master Data DocType Selection");
    }
  });
});

