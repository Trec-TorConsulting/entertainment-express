import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Music Library", () => {
  test("navigates to Music view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Music");
    await assertShell(ownerPage, "Music Page");
  });
});
