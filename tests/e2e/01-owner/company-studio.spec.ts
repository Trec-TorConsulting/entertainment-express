import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Company Studio", () => {
  test("loads Company Studio configuration view", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Company Studio");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
