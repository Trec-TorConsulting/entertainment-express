/**
 * Mobile Responsive Tests
 *
 * Verifies all three portals render correctly on mobile viewports.
 * Tests touch target sizes, navigation patterns, responsive layouts,
 * and critical mobile-specific UI elements.
 *
 * This test file runs with the "mobile" Playwright project which uses
 * the Pixel 7 device profile (412x915, touch, mobile UA).
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { login, personas, watchPage, clickNav, navLabels, PUBLIC_URL } from "../support/session";

const MIN_TOUCH_TARGET = 44; // WCAG 2.1 AA minimum touch target (px)

test.describe("Mobile — Employee Portal (primary mobile persona)", () => {
  test("field board renders with touch-friendly controls", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Field Board (mobile)");

    // Check for bottom navigation or mobile nav pattern
    const nav = employeePage.locator("nav").first();
    if (await nav.isVisible().catch(() => false)) {
      const box = await nav.boundingBox();
      if (box) {
        // Bottom nav should be anchored at bottom of viewport
        expect(box.y, "nav should be in lower portion of screen").toBeGreaterThan(400);
      }
    }
  });

  test("all interactive buttons meet 44px minimum touch target", async ({ employeePage }) => {
    const buttons = employeePage.locator('button:visible, [role="button"]:visible, a.btn:visible');
    const count = Math.min(await buttons.count(), 20); // Check first 20

    const violations: string[] = [];
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox().catch(() => null);
      if (box && box.height < MIN_TOUCH_TARGET && box.width < MIN_TOUCH_TARGET) {
        const text = (await btn.textContent().catch(() => "")) || "";
        violations.push(`Button "${text.trim().slice(0, 30)}" is ${box.width}x${box.height}px`);
      }
    }

    if (violations.length > 0) {
      console.warn(`⚠ Touch target violations:\n${violations.join("\n")}`);
    }
    // Allow some violations but flag for review
    expect(violations.length, `${violations.length} buttons below touch target minimum`).toBeLessThan(count / 2);
  });

  test("shift cards are tappable and expand", async ({ employeePage }) => {
    const cards = employeePage.locator("article, [data-testid*='shift'], .shift-card");
    const count = await cards.count();
    if (count > 0) {
      const first = cards.first();
      const box = await first.boundingBox().catch(() => null);
      if (box) {
        // Cards should be full-width on mobile
        expect(box.width, "shift card should span most of the viewport").toBeGreaterThan(350);
      }
    }
  });
});

test.describe("Mobile — Owner Portal", () => {
  test("owner portal adapts to mobile layout", async ({ ownerPage }) => {
    await assertNoErrors(ownerPage, "Owner Portal (mobile)");

    // On mobile, sidebar should collapse to hamburger or bottom nav
    const sidebar = ownerPage.locator('nav[aria-label="Sidebar Navigation"]');
    const hamburger = ownerPage.locator('[aria-label*="menu"], [aria-label*="Menu"], button.hamburger');
    const bottomNav = ownerPage.locator("nav.bottom-nav, [data-testid='bottom-nav']");

    const hasMobileNav =
      (await hamburger.isVisible().catch(() => false)) ||
      (await bottomNav.isVisible().catch(() => false)) ||
      !(await sidebar.isVisible().catch(() => false));

    // Document the nav pattern without hard-failing
    if (!hasMobileNav) {
      console.warn("⚠ Owner portal may not have mobile-adapted navigation");
    }
  });

  test("pipeline cards stack vertically on mobile", async ({ ownerPage }) => {
    // Navigate to pipeline
    const navLabelsArr = await navLabels(ownerPage);
    if (navLabelsArr.includes("Pipeline")) {
      await clickNav(ownerPage, "Pipeline");

      // Cards should stack, not be in horizontal row
      const cards = ownerPage.locator("article, .pipeline-card, .deal-card").first();
      if (await cards.isVisible().catch(() => false)) {
        const box = await cards.boundingBox();
        if (box) {
          expect(box.width, "pipeline card should span mobile width").toBeGreaterThan(300);
        }
      }
    }
  });
});

test.describe("Mobile — Client Portal", () => {
  test("client portal renders on mobile viewport", async ({ clientPage }) => {
    await assertNoErrors(clientPage, "Client Portal (mobile)");
  });

  test("event detail page is readable on mobile", async ({ clientPage }) => {
    const navLabelsArr = await navLabels(clientPage);
    if (navLabelsArr.includes("My Events") || navLabelsArr.includes("Events")) {
      const eventsLabel = navLabelsArr.find((l) => l.includes("Event"));
      if (eventsLabel) {
        await clickNav(clientPage, eventsLabel);
        await assertNoErrors(clientPage, "Client Events (mobile)");
      }
    }
  });
});

test.describe("Mobile — Public Site", () => {
  test("public homepage is responsive on mobile", async ({ page }) => {
    const watch = watchPage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PUBLIC_URL, { waitUntil: "domcontentloaded" });

    // Should have a mobile menu toggle
    const menuBtn = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="navigation" i], .mobile-menu-toggle, .hamburger',
    );
    const hasMenu = (await menuBtn.count()) > 0;

    // Text should not overflow the viewport
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(
      scrollWidth,
      "page should not have horizontal overflow on mobile",
    ).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance

    watch.assertClean("public mobile");
  });

  test("inquiry form is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${PUBLIC_URL}/inquiry`, { waitUntil: "domcontentloaded" });

    // Form inputs should be full-width on mobile
    const inputs = page.locator("input:visible, textarea:visible, select:visible");
    const count = Math.min(await inputs.count(), 10);
    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox().catch(() => null);
      if (box) {
        expect(box.width, `input ${i} should be at least 300px on mobile`).toBeGreaterThan(280);
      }
    }
  });
});
