import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — People & Team", () => {
  test("navigates to People view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "People");
    await assertShell(ownerPage, "People Page");
  });
});
