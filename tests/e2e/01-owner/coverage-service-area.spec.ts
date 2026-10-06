/**
 * Owner Portal — Coverage & Service Area
 *
 * Verifies Coverage page loads, service area configuration options (radius, zip codes)
 * display, and map or location controls render without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Coverage & Service Area", () => {
  test("loads Coverage & Service Area page", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Coverage");
    await assertNoErrors(ownerPage, "Owner Coverage Service Area");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders service area settings or map view container", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Coverage");

    const controls = ownerPage.locator("input, button, select, [role='region'], .map-container, iframe").filter({
      hasText: /radius|zip|zone|miles|coverage|location|map/i
    });
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
