import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Features Overview Pages", () => {
  test("guest visits features overview and detail pages", async ({ guestPage }) => {
    await assertNoErrors(guestPage, "Public Features Pages");
  });
});
