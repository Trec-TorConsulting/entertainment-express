import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Lead Inquiry Form", () => {
  test("guest visits lead inquiry page", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Lead Inquiry Form");
  });
});
