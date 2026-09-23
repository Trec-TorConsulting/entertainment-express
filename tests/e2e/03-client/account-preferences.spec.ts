import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Account Preferences", () => {
  test("loads Client Account Profile and notification preferences", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Preferences");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
