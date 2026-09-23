import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Gear & Assets", () => {
  test("navigates to Gear view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Gear");
    await assertShell(ownerPage, "Gear Page");
  });
});
