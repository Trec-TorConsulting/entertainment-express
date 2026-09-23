import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Guest Music Requests", () => {
  test("guest visits music request portal", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Guest Music Request Portal");
  });
});
