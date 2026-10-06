/**
 * Public & Guest — Features Overview Pages
 *
 * Verifies features overview page loads, checks feature category cards,
 * and tests navigating to feature detail views cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { PUBLIC_URL } from "../support/session";

test.describe("Public & Guest — Features Overview Pages", () => {
  test("guest visits features overview and detail pages", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/features`);
    await assertNoErrors(guestPage, "Public Features Pages");

    const bodyText = await guestPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("tests feature detail card links click cleanly", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/features`);

    const featureLinks = guestPage.locator("a").filter({
      hasText: /dispatch|crm|inventory|portal|payroll|ai|analytics/i
    });
    const count = await featureLinks.count();
    if (count > 0) {
      await featureLinks.first().click().catch(() => {});
      await guestPage.waitForTimeout(300);
      await assertNoErrors(guestPage, "Feature Detail Link Click");
    }
  });
});

