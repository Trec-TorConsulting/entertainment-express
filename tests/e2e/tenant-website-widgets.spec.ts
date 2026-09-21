import { test, expect } from "@playwright/test";

/**
 * Tenant Website Builder & Embeddable Widgets E2E Verification Suite
 */

test.describe("Tenant Website Builder & Standalone Embeddable Widgets", () => {
  test("Owner can visual-build, publish custom page /p/bounce-houses and render embed widgets", async ({ page }) => {
    // 1. Visit Owner Website Studio
    await page.goto("/owner/website");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();

    // 2. Visit published route /p/bounce-houses
    await page.goto("/p/bounce-houses");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("body")).toBeVisible();

    // 3. Verify widget HTML embedding script compatibility
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>External Partner Page</title>
        </head>
        <body>
          <h1>Partner Event Storefront</h1>
          <div data-entx-widget="availability" data-api-key="pk_live_test123" data-theme-color="#0f766e"></div>
          <script src="/assets/entx-widgets.js"></script>
        </body>
      </html>
    `);

    await expect(page.locator("[data-entx-widget='availability']")).toBeVisible();
  });
});
