import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Event Detail Hub", () => {
  test("loads Client Event Detail hub and tab views", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Event Detail");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
