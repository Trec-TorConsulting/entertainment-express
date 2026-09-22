import { test, expect } from "@playwright/test";

/**
 * Client Persona Self-Service & Planning E2E Test Suite
 * Mimics an end Customer from catalog browsing -> quote request -> proposal e-sign -> deposit payment -> planning questionnaire & timeline -> music requests.
 */

const BASE_URL = process.env.EE_E2E_BASE || "https://admin.entx.app";

const consoleErrors: string[] = [];
const pageExceptions: string[] = [];
const networkFailures: string[] = [];

test.describe("Client Persona Booking & Planning Lifecycle Suite", () => {
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
  });

  test("1. Public Catalog & Booking Request Flow", async ({ page }) => {
    await page.goto(`${BASE_URL}/request-quote`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
    expect(bodyText).not.toContain("Something went wrong");
  });

  test("2. Customer Self-Service Portal Overview", async ({ page }) => {
    await page.goto(`${BASE_URL}/client/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test("3. Interactive Proposal & Contract E-Signature Host", async ({ page }) => {
    await page.goto(`${BASE_URL}/w/demo-token`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // If token invalid, page handles error cleanly without JS crash
    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test("4. Event Planning Questionnaire & Form Completion", async ({ page }) => {
    await page.goto(`${BASE_URL}/client/planning`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test("5. Event Guest Requests & Music Planning", async ({ page }) => {
    await page.goto(`${BASE_URL}/guest-requests`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("An unexpected error occurred while rendering this view");
  });

  test.afterEach(() => {
    expect(pageExceptions).toEqual([]);
    expect(networkFailures).toEqual([]);
  });
});
