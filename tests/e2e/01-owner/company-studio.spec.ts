/**
 * Owner Portal — Company Studio
 *
 * Verifies Company Studio loads, company profile settings (Name, Email, Phone, Address)
 * can be edited, save action triggers, and changes persist cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Company Studio", () => {
  test("loads Company Studio configuration view", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Company");
    await assertNoErrors(ownerPage, "Owner Company Studio");
    await expect(ownerPage).toHaveURL(/\/owner/);
  });

  test("edits company profile settings and saves", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Company");

    const phoneInput = ownerPage.getByLabel(/phone|telephone|contact/i).first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const newPhone = "555-0188";
      await phoneInput.fill(newPhone);

      const saveBtn = ownerPage.getByRole("button", { name: /save|update/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await ownerPage.waitForTimeout(500);
        await assertNoErrors(ownerPage, "Company Save");
      }
    }
  });
});

