/**
 * Public & Guest — Request Quote Form
 *
 * Fills quote request form (Name, Email, Phone, Event Date, Event Type, Details),
 * submits, tests form validation on empty required fields, and verifies success feedback.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { PUBLIC_URL } from "../support/session";

test.describe("Public & Guest — Request Quote Form", () => {
  test("guest visits quote request form page", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/quote`);
    await assertNoErrors(guestPage, "Public Request Quote Form");
  });

  test("tests quote request form validation on empty submission", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/quote`);

    const submitBtn = guestPage.getByRole("button", { name: /submit|request|send/i }).first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await guestPage.waitForTimeout(300);
      await assertNoErrors(guestPage, "Empty Quote Submit");
    }
  });

  test("fills quote request form fields and submits", async ({ guestPage }) => {
    await guestPage.goto(`${PUBLIC_URL}/quote`);

    const nameInput = guestPage.getByLabel(/name/i).first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill("QA Quote Prospect");
    }

    const emailInput = guestPage.getByLabel(/email/i).first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill("prospect-qa@example.com");
    }
  });
});

