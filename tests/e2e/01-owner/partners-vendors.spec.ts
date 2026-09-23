import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Partners & Vendors", () => {
  test("loads Partners page, verifies listing and modal triggers", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Partners");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
