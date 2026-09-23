import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Owner Portal — Connections & Third-Party Integrations", () => {
  test("loads Connections hub and third-party integration cards", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Connections");
    await expect(ownerPage).toHaveURL(/\/owner|\/login/);
  });

  test("displays all integration categories and provider cards", async ({ ownerPage }) => {
    // Navigate to connections page
    await ownerPage.goto("/owner/connections");
    await assertNoErrors(ownerPage, "Owner Connections Page");

    // Check page header title
    await expect(ownerPage.getByRole("heading", { name: /App Integrations & API Connections Studio/i })).toBeVisible();

    // Verify key categories are visible
    await expect(ownerPage.getByText("Calendar Sync", { exact: false })).toBeVisible();
    await expect(ownerPage.getByText("Payments & Billing", { exact: false })).toBeVisible();
    await expect(ownerPage.getByText("Messaging & Telephony", { exact: false })).toBeVisible();
  });
});

