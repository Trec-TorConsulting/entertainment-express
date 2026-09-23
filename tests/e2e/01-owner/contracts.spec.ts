import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Contracts", () => {
  test("navigates to Contracts view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Contracts");
    await assertShell(ownerPage, "Contracts Page");
  });
});
