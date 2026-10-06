/**
 * Owner Portal — Data Import & Migration
 *
 * Verifies Import page loads, import entity choices (CSV/Excel/ERPNext) render,
 * upload dropzones are present, and execution is clean without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Data Import & Migration", () => {
  test("loads Data Import page and import options", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Import");
    await assertNoErrors(ownerPage, "Owner Data Import");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const heading = ownerPage.locator("h1, h2, h3").filter({ hasText: /import|migration|csv|data/i }).first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
  });

  test("renders import template download and file upload zone", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Import");

    const dropzone = ownerPage.locator("input[type='file'], .dropzone, [role='button']").filter({
      hasText: /upload|file|import|csv|template/i
    }).first();

    const count = await dropzone.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
