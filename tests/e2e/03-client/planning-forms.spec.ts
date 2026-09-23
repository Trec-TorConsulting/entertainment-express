import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Planning Forms", () => {
  test("client views planning form page without errors", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Planning Forms");
  });
});
