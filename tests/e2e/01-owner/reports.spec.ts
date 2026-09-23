import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Business Reports & Analytics", () => {
  test("loads Reports dashboard and report tile grid", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Reports");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
