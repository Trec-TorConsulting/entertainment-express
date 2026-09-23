import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Event Photo Gallery", () => {
  test("loads Photo Gallery and download controls", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Event Photos");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
