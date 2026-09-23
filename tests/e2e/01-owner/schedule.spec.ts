import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Schedule Operations", () => {
  test("navigates to Schedule view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Schedule");
    await assertShell(ownerPage, "Schedule Page");
  });
});
