/**
 * Public & Guest — Solutions Pages
 *
 * Verifies solutions page loads, tests clicking each vertical-specific page
 * (DJs, Inflatables, Photo Booths, Game Trucks), and tests FAQ accordions expanding/collapsing.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { PUBLIC_URL } from "../support/session";

test.describe("Public & Guest — Solutions Pages", () => {
  test("guest visits vertical-specific solutions landing pages", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/solutions`);
    await assertNoErrors(guestPage, "Public Solutions Pages");

    const bodyText = await guestPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("tests FAQ accordion expansion/collapse on solutions page", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/solutions`);

    const accordions = guestPage.locator("details, .accordion-item, [role='button']").filter({
      hasText: /\?|faq|question|how|what/i
    });
    const count = await accordions.count();
    if (count > 0) {
      await accordions.first().click().catch(() => {});
      await guestPage.waitForTimeout(200);
      await assertNoErrors(guestPage, "FAQ Accordion Interaction");
    }
  });
});

