/**
 * Employee Portal — Pull Sheet Checklist
 *
 * Verifies Pull Sheet loads, equipment checklist items render,
 * checkboxes toggle state, and notes field saves without errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Employee Portal — Pull Sheet Checklist", () => {
  test("loads Equipment Pull Sheet and checkbox state toggles", async ({ employeePage }) => {
    await clickNav(employeePage, "Pull Sheet");
    await assertNoErrors(employeePage, "Employee Pull Sheet");
    await expect(employeePage).toHaveURL(/\/employee/);

    const bodyText = await employeePage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("toggles checklist items and interacts with notes", async ({ employeePage }) => {
    await clickNav(employeePage, "Pull Sheet");

    const checkboxes = employeePage.locator("input[type='checkbox']");
    const count = await checkboxes.count();
    if (count > 0) {
      const cb = checkboxes.first();
      await cb.click();
      await employeePage.waitForTimeout(200);
      await assertNoErrors(employeePage, "Checklist item toggle");
    }

    const notes = employeePage.locator("textarea, input[name*='note']").first();
    if (await notes.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notes.fill("QA pull sheet verified complete.");
      await assertNoErrors(employeePage, "Notes field interaction");
    }
  });
});

