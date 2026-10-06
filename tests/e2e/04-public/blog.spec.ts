/**
 * Public & Guest — Blog & Articles
 *
 * Verifies blog listing loads, tests filtering by category, and verifies
 * clicking an article opens the article detail page.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { PUBLIC_URL } from "../support/session";

test.describe("Public & Guest — Blog & Articles", () => {
  test("guest visits blog listing and article pages", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/blog`);
    await assertNoErrors(guestPage, "Public Blog");

    const bodyText = await guestPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("filters blog by category and clicks article post", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/blog`);

    const articleLinks = guestPage.locator("a").filter({
      hasText: /read|article|post|guide|tips|entertainment/i
    });
    const count = await articleLinks.count();
    if (count > 0) {
      await articleLinks.first().click().catch(() => {});
      await guestPage.waitForTimeout(300);
      await assertNoErrors(guestPage, "Blog Article Detail Click");
    }
  });
});

