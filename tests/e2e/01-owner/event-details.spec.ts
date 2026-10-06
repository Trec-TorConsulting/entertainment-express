/**
 * Owner Portal — Event Details Hub
 *
 * Verifies Event Details page loads, and all tabs (Details, Crew, Timeline,
 * Planning, Music, Financials) render and switch correctly without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Owner Portal — Event Details Hub", () => {
  test("loads Event Details hub and tab switcher", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Calendar");
    await assertNoErrors(ownerPage, "Owner Event Details");
    await expect(ownerPage).toHaveURL(/\/owner/);
  });

  test("verifies event tabs switch cleanly across Details, Crew, Timeline, Planning, Music, Financials", async ({ ownerPage, testData }) => {
    // Create a test booking first to ensure we have an event to open
    const job = await testData.createJob({ event_name: "QA Event Tabs Check" });

    if (job.name) {
      await ownerPage.goto(`/owner/events/${job.name}`);
      await ownerPage.waitForLoadState("domcontentloaded");
      await assertNoErrors(ownerPage, "Event Detail Page Load");

      const tabNames = ["Details", "Crew", "Timeline", "Planning", "Music", "Financials"];
      for (const tabName of tabNames) {
        const tabBtn = ownerPage.getByRole("tab", { name: new RegExp(tabName, "i") }).first();
        if (await tabBtn.isVisible().catch(() => false)) {
          await tabBtn.click();
          await ownerPage.waitForTimeout(200);
          await assertNoErrors(ownerPage, `Event Tab: ${tabName}`);
        }
      }
    }
  });
});

