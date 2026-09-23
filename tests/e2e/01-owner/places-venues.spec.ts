import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Places & Venues", () => {
  test("navigates to Places view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Places");
    await assertShell(ownerPage, "Places Page");
  });
});
