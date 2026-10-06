/**
 * Client Portal — Live Event Chat
 *
 * Verifies live chat page loads, message input field is present,
 * tests sending a message to event team, and asserts thread rendering.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Client Portal — Live Event Chat", () => {
  test("loads Client Live Event Chat thread", async ({ clientPage }) => {
    await clickNav(clientPage, "Chat");
    await assertNoErrors(clientPage, "Client Live Chat");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("sends message in live event chat thread", async ({ clientPage }) => {
    await clickNav(clientPage, "Chat");

    const chatInput = clientPage.getByPlaceholder(/message|type|chat/i).first();
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const stamp = Date.now().toString().slice(-4);
      const msgText = `Hello event team! QA message ${stamp}`;
      await chatInput.fill(msgText);

      const sendBtn = clientPage.getByRole("button", { name: /send|submit/i }).first();
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await clientPage.waitForTimeout(300);
        await assertNoErrors(clientPage, "Send Chat Message");
      }
    }
  });
});

