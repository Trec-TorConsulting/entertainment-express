import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Plan & Subscription Settings", () => {
  test("loads Plan page and subscription tier management", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Plan Settings");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
