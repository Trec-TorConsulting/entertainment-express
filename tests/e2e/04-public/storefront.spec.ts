import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Storefront", () => {
  test("guest visits public storefront page", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Storefront");
  });
});
