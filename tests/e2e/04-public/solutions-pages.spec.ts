import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Solutions Pages", () => {
  test("guest visits vertical-specific solutions landing pages", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Solutions Pages");
  });
});
