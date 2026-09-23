import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Live Event Chat", () => {
  test("loads Client Live Event Chat thread", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Live Chat");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
