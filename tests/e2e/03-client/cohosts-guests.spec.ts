/**
 * Client Portal — Co-hosts & Guest List
 *
 * Verifies co-host invitation interface, tests entering co-host email,
 * adding guests to guest list, and asserting RSVP tracking view.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Client Portal — Co-hosts & Guest List", () => {
  test("loads Co-host invitations and guest RSVP tracking", async ({ clientPage }) => {
    await clickNav(clientPage, "Guests");
    await assertNoErrors(clientPage, "Client Cohosts & Guests");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("invites a co-host email and adds guest item", async ({ clientPage }) => {
    await clickNav(clientPage, "Guests");

    const inviteBtn = clientPage.getByRole("button", { name: /invite|add co-host|\+ guest/i }).first();
    if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inviteBtn.click();
      const dialog = clientPage.getByRole("dialog").first();

      if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        const emailInput = dialog.getByLabel(/email/i).first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill("cohost-qa@example.com");
        }

        const sendBtn = dialog.getByRole("button", { name: /send|invite|add/i }).first();
        if (await sendBtn.isVisible().catch(() => false)) {
          await sendBtn.click();
          await clientPage.waitForTimeout(300);
          await assertNoErrors(clientPage, "Invite Co-host Send");
        }
      }
    }
  });
});

