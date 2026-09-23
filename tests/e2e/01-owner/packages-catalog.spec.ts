import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Packages & Catalog", () => {
  test("navigates to Packages view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Packages");
    await assertShell(ownerPage, "Packages Page");
  });
});
