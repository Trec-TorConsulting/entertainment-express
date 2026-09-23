import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Request Quote Form", () => {
  test("guest visits quote request form page", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Request Quote Form");
  });
});
