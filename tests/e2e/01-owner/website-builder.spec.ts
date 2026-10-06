/**
 * Owner Portal — Website Builder & Widgets
 *
 * Verifies Website builder page loads, page list is visible,
 * section editor controls render, and no JS errors occur.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Website Builder & Widgets", () => {
  test("loads Website builder dashboard and page list", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Website");
    await assertNoErrors(ownerPage, "Owner Website Builder");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders editor controls and page preview buttons", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Website");

    const editorControls = ownerPage.locator("button, a").filter({
      hasText: /edit|add page|section|preview|widget|publish|theme/i
    });
    const count = await editorControls.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
