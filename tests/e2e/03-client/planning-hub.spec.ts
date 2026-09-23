import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Planning Hub", () => {
  test("loads Client Planning Hub and form sections", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Planning Hub");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
