import { test, expect } from "../support/fixtures";
import { clickNav, assertShell } from "../support/session";

test.describe("Owner Portal — Calendar & Booking Operations", () => {
  test("navigates to Calendar view and asserts clean shell", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Calendar");
    await assertShell(ownerPage, "Calendar Page");
  });
});
