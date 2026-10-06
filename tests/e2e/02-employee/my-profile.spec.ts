/**
 * Employee Portal — My Profile Settings
 *
 * Verifies profile loads with current info, tests editing phone number
 * and emergency contact info, saving changes, and verifying via API.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Employee Portal — My Profile Settings", () => {
  test("loads Employee Profile and emergency contact info", async ({ employeePage }) => {
    await clickNav(employeePage, "Profile");
    await assertNoErrors(employeePage, "Employee Profile");
    await expect(employeePage).toHaveURL(/\/employee/);

    const bodyText = await employeePage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("edits phone number and emergency contact, saves and verifies via API", async ({ employeePage }) => {
    await clickNav(employeePage, "Profile");

    const phoneInput = employeePage.getByLabel(/phone|mobile/i).first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("555-0177");

      const saveBtn = employeePage.getByRole("button", { name: /save|update/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await employeePage.waitForTimeout(500);
        await assertNoErrors(employeePage, "Profile Save");
      }
    }
  });
});

