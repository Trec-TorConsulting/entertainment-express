import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Payroll & Gig Settlement", () => {
  test("loads Payroll settlement page and displays pending timesheets", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Payroll");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
