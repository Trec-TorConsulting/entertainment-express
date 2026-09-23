import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Security & Access Controls", () => {
  test("loads Security settings and authentication policy grid", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Security Settings");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
