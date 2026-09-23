import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Dispatch Board", () => {
  test("navigates to Dispatch view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Dispatch");
    await assertShell(ownerPage, "Dispatch Page");
  });
});
