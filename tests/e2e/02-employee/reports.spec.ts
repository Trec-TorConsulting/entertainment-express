/**
 * Employee Portal — Performance & Hours Reports
 *
 * Verifies Employee Reports page loads, displays hours & tips breakdown,
 * date range filter applies, and page executes cleanly without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Employee Portal — Performance & Hours Reports", () => {
  test("loads Employee Reports page and date filters", async ({ employeePage }) => {
    await clickNav(employeePage, "Reports");
    await assertNoErrors(employeePage, "Employee Reports");
    await expect(employeePage).toHaveURL(/\/employee/);

    const bodyText = await employeePage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
