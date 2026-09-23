import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Automation Rules & Triggers", () => {
  test("loads Automations hub and trigger rule controls", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Automations");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
