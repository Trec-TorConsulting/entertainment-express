import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Free Trial Signup", () => {
  test("guest visits free trial signup form page", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Signup Trial Form");
  });
});
