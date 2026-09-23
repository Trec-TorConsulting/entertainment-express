import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — System Settings", () => {
  test("navigates to Settings view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Settings");
    await assertShell(ownerPage, "Settings Page");
  });
});
