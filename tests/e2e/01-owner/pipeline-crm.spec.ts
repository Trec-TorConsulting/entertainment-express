import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Pipeline & CRM", () => {
  test("navigates to Pipeline view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Pipeline");
    await assertShell(ownerPage, "Pipeline Page");
  });
});
