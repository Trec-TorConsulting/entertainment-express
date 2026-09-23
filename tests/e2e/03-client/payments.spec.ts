import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Payments", () => {
  test("client views invoice and payment page without errors", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Payments");
  });
});
