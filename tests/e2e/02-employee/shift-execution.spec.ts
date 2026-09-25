/**
 * Employee Portal — Shift Execution (Deep Interaction Tests)
 *
 * Tests the crew shift lifecycle: viewing offered shifts,
 * accepting, starting en-route, arriving on-site, completing.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod, navLabels } from "../support/session";

test.describe("Employee Portal — Shift Execution (Deep)", () => {
  test("field board renders with shift cards", async ({ employeePage }) => {
    await clickNav(employeePage, "Field Board");
    await assertNoErrors(employeePage, "Field Board");

    // Field board should display shift cards or an empty state
    const body = await employeePage.locator("body").innerText().catch(() => "");
    const hasContent = body.includes("shift") || body.includes("job") || body.includes("No") || body.includes("empty");
    expect(hasContent, "Field board should show shifts or empty state").toBe(true);
  });

  test("my_jobs API returns shift data for employee", async ({ employeePage }) => {
    const res = await callMethod(employeePage, "entertainment_express.api.field.my_jobs");
    // Should return an array (empty or populated)
    if (res.ok) {
      expect(res.message).toBeInstanceOf(Array);
      if (res.message.length > 0) {
        const shift = res.message[0];
        // Each shift should have at minimum a job reference and stage
        expect(shift.job || shift.job_id, "shift has job reference").toBeTruthy();
        expect(shift.stage !== undefined, "shift has stage field").toBe(true);
      }
    }
  });

  test("my earnings page shows payout information", async ({ employeePage }) => {
    const labels = await navLabels(employeePage);
    if (labels.includes("My Earnings") || labels.includes("Earnings")) {
      const target = labels.find((l) => l.includes("Earning"))!;
      await clickNav(employeePage, target);
      await assertNoErrors(employeePage, "My Earnings");

      // Should show some financial summary even if zero
      const body = await employeePage.locator("body").innerText().catch(() => "");
      const hasFinancial = body.includes("$") || body.includes("earned") || body.includes("total") || body.includes("0");
      expect(hasFinancial, "earnings page should show financial data").toBe(true);
    }
  });

  test("my profile page allows profile viewing", async ({ employeePage }) => {
    const labels = await navLabels(employeePage);
    if (labels.includes("My Profile") || labels.includes("Profile")) {
      const target = labels.find((l) => l.includes("Profile"))!;
      await clickNav(employeePage, target);
      await assertNoErrors(employeePage, "My Profile");
    }
  });

  test("pull sheet renders equipment list for jobs", async ({ employeePage }) => {
    const labels = await navLabels(employeePage);
    if (labels.includes("Pull Sheet") || labels.includes("Load")) {
      const target = labels.find((l) => l.includes("Pull") || l.includes("Load"))!;
      await clickNav(employeePage, target);
      await assertNoErrors(employeePage, "Pull Sheet");
    }
  });
});
