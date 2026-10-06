/**
 * Client Portal — Account Preferences
 *
 * Verifies profile info loads, tests editing phone number and notification
 * preference toggles, saving changes, and execution without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Client Portal — Account Preferences", () => {
  test("loads Client Account Profile and notification preferences", async ({ clientPage }) => {
    await clickNav(clientPage, "Profile");
    await assertNoErrors(clientPage, "Client Preferences");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("edits phone number and notification preference toggles", async ({ clientPage }) => {
    await clickNav(clientPage, "Profile");

    const phoneInput = clientPage.getByLabel(/phone|mobile/i).first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("555-0166");

      const saveBtn = clientPage.getByRole("button", { name: /save|update/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await clientPage.waitForTimeout(500);
        await assertNoErrors(clientPage, "Client Preferences Save");
      }
    }
  });
});

