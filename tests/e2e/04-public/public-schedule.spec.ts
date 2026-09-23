import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Public Availability Schedule", () => {
  test("guest views public availability schedule", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Availability Schedule");
  });
});
