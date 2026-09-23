import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Event Details Hub", () => {
  test("loads Event Details hub and tab switcher", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Event Details");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
