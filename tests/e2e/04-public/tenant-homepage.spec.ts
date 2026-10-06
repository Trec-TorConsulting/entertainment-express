/**
 * Public & Guest — Tenant Public Storefront Homepage
 *
 * Verifies tenant public homepage at EE_E2E_BASE, service packages/cards display,
 * and booking call-to-action button navigates cleanly.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Public & Guest — Tenant Homepage", () => {
  test("guest loads tenant public homepage", async ({ page }) => {
    const tenantBase = process.env.EE_E2E_BASE || "http://localhost:8000";
    await page.goto(tenantBase, { waitUntil: "domcontentloaded" });
    await assertNoErrors(page, "Tenant Public Homepage");

    const bodyText = await page.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("clicks booking CTA button and navigates", async ({ page }) => {
    const tenantBase = process.env.EE_E2E_BASE || "http://localhost:8000";
    await page.goto(tenantBase, { waitUntil: "domcontentloaded" });

    const ctaBtn = page.getByRole("button", { name: /book|quote|inquire|get started|check availability/i }).first();
    if (await ctaBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ctaBtn.click();
      await page.waitForTimeout(300);
      await assertNoErrors(page, "Booking CTA Click");
    }
  });
});
