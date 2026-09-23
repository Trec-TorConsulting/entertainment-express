import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Emergency Overrides", () => {
  test("loads Emergency Overrides control panel", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Emergency Overrides");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
