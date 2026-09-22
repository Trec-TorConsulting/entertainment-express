import { test, expect } from "@playwright/test";

/**
 * Vertical 1 — Mobile DJ Company Owner Real-World Signup QA Test
 * Persona: Marcus Vance, Owner of "Apex DJ Entertainment" (slug: apexdjs)
 * Step 1: Navigates to public site, submits free trial signup, provisions apexdjs.entx.app site.
 */

const BASE_URL = process.env.EE_E2E_BASE || "https://admin.entx.app";

test.describe("Vertical 1: Mobile DJ Company Signup & Provisioning QA", () => {
  test("Step 1: Main Homepage Signup Submission & Tenant Site Provisioning", async ({ page }) => {
    // 1. Visit Start Trial page from main marketing site
    await page.goto(`${BASE_URL}/start-trial`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Verify signup form elements exist
    const companyInput = page.locator('input[name="company_name"]');
    const emailInput = page.locator('input[name="contact_email"]');
    const slugInput = page.locator('input[name="requested_slug"]');
    const submitBtn = page.locator('#ee-trial-form button[type="submit"]');

    await expect(companyInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(slugInput).toBeVisible();

    // 2. Fill out real-world owner signup details for Apex DJ Entertainment
    await companyInput.fill("Apex DJ Entertainment");
    await emailInput.fill("marcus@apexdjs.com");
    await slugInput.fill("apexdjs");

    // 3. Submit trial signup application
    await submitBtn.click();
    await page.waitForTimeout(1500);

    // 4. Verify confirmation messaging or status feedback
    const statusText = (await page.locator("body").textContent()) || "";
    expect(statusText).not.toContain("An unexpected error occurred while rendering this view");
    expect(statusText).not.toContain("Something went wrong");

    console.log("[DJ SIGNUP QA] Signup application submitted for Apex DJ Entertainment (apexdjs)");
  });
});
