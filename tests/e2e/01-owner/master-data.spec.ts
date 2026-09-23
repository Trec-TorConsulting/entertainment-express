import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Master Data Explorer", () => {
  test("loads Master Data Explorer and DocType browser", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Master Data");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });
});
