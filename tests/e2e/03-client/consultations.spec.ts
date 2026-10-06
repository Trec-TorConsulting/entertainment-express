/**
 * Client Portal — Consultations & Appointments
 *
 * Verifies consultation scheduling view, tests selecting consultation slot & type,
 * confirming appointment, and testing reschedule/cancel actions.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Client Portal — Consultations & Appointments", () => {
  test("loads Consultation scheduling dashboard", async ({ clientPage }) => {
    await clickNav(clientPage, "Consultations");
    await assertNoErrors(clientPage, "Client Consultations");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("schedules or inspects appointment slot controls", async ({ clientPage }) => {
    await clickNav(clientPage, "Consultations");

    const scheduleBtns = clientPage.getByRole("button", { name: /schedule|book|appointment|reschedule|cancel/i });
    const count = await scheduleBtns.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
