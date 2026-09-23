import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Blog & Articles", () => {
  test("guest visits blog listing and article pages", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Blog");
  });
});
