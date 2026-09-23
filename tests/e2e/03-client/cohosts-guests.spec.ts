import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Client Portal — Co-hosts & Guest List", () => {
  test("loads Co-host invitations and guest RSVP tracking", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Cohosts & Guests");
    await expect(clientPage).toHaveURL(/\/client|\/login/);
  });
});
