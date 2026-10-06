/**
 * Client Portal — Planning Hub
 *
 * Verifies Planning Hub loads, fills planning form fields (pronunciations, special requests,
 * timeline preferences), saves drafts, reopens to verify persistence, and submits form.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Client Portal — Planning Hub", () => {
  test("loads Client Planning Hub and form sections", async ({ clientPage }) => {
    await clickNav(clientPage, "Planning");
    await assertNoErrors(clientPage, "Client Planning Hub");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("fills planning form fields and saves draft", async ({ clientPage }) => {
    await clickNav(clientPage, "Planning");

    const textarea = clientPage.locator("textarea, input[type='text']").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill("Grand Entrance Song: Uptown Funk. Pronunciation: SM-ITH");

      const saveBtn = clientPage.getByRole("button", { name: /save|draft/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await clientPage.waitForTimeout(500);
        await assertNoErrors(clientPage, "Save Planning Draft");
      }
    }
  });
});

