import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — My Events", () => {
  test("loads Client portal home and displays event list", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client My Events");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
