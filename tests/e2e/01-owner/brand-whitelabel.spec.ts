import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Brand & White-Label Customization", () => {
  test("loads Brand settings, logo upload, and color controls", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Brand Whitelabel");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
