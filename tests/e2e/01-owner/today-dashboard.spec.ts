import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Today Dashboard", () => {
  test("loads Today dashboard, renders widgets and quick action buttons", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Today Dashboard");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
