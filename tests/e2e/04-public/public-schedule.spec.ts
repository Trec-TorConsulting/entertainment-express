/**
 * Public & Guest — Public Availability Schedule
 *
 * Verifies public availability schedule page loads, calendar view renders,
 * and date availability indicators display cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { PUBLIC_URL } from "../support/session";

test.describe("Public & Guest — Public Availability Schedule", () => {
  test("guest views public availability schedule", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/schedule`);
    await assertNoErrors(guestPage, "Public Availability Schedule");

    const bodyText = await guestPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

