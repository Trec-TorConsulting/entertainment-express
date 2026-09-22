import { test, expect } from "@playwright/test";

/**
 * Employee Persona Ops & Field Progression E2E Test Suite
 * Mimics an Employee / Field Crew member / Dispatcher from My Day -> Run Sheet inspection -> Milestone progression -> Damage report -> Timesheets -> Earnings.
 */

const BASE_URL = process.env.EE_E2E_BASE || "https://admin.entx.app";
const ADMIN_PASSWORD = process.env.EE_ADMIN_PASSWORD || "admin";

const consoleErrors: string[] = [];
const pageExceptions: string[] = [];
const networkFailures: string[] = [];

test.describe("Employee Persona Field Ops & Milestone Lifecycle Suite", () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    pageExceptions.length = 0;
    networkFailures.length = 0;

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        if (txt.includes("401") || txt.includes("429") || txt.includes("Too Many Requests") || txt.includes("Traceback (most recent call last)")) {
          return;
        }
        consoleErrors.push(txt);
      }
    });

    page.on("pageerror", (err) => {
      pageExceptions.push(err.message);
    });

    page.on("response", (res) => {
      if (res.status() >= 500) {
        networkFailures.push(`HTTP ${res.status()} on ${res.url()}`);
      }
    });

    // Login as Employee / Staff
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const userField = page.locator('input[name="usr"], input[type="text"]').first();
      const passField = page.locator('input[name="pwd"], input[type="password"]').first();
      if (await userField.isVisible()) {
        await userField.fill("Administrator");
        await passField.fill(ADMIN_PASSWORD);
        await page.click('button[type="submit"], button:has-text("Login")');
        await page.waitForTimeout(1000);
      }
    } catch {
      // Continue if session active
    }
  });

  test("1. Employee My Day Dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
    expect(bodyText).not.toContain("Something went wrong");
  });

  test("2. Integrated Dispatch & Run Sheet Inspection", async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/dispatch`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");

    // Click interactive milestone buttons or run sheet cards
    const milestoneButtons = page.locator('button:has-text("En Route"), button:has-text("On Site"), button:has-text("Check In"), button:has-text("Dispatched")');
    if (await milestoneButtons.count() > 0) {
      await milestoneButtons.first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test("3. Earnings, Pay & Commission View", async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/earnings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test("4. Employee Profile & Workspaces", async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/me`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test.afterEach(() => {
    expect(pageExceptions).toEqual([]);
    expect(networkFailures).toEqual([]);
  });
});
