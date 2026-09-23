import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Grow & Marketing Campaigns", () => {
  test("loads Grow marketing dashboard and lead gen tools", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Grow Marketing");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
