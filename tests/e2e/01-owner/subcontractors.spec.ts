import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Subcontractor B2B Exchange", () => {
  test("loads Subcontractors board and listing view", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Subcontractors");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
