import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Contract Signing", () => {
  test("client views contract page without errors", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Contract Signing");
  });
});
