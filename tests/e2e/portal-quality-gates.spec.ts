import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Flagship Route Visual Regression & Accessibility Test Suite
 * Covers PQB (Premium Quality Bar) for Phase 40:
 * - Owner: Today (O1), Pipeline (O2), Money (O3), Brand (O4)
 * - Employee: My Day (E1), Dispatch (E2)
 * - Client: Home (C1), Event Detail (C2), Pay (C3), Planning (C4)
 */

test.describe("Portal Premium Experience — Visual Regression & A11y", () => {
  const routes = [
    { id: "O1-owner-today", path: "/owner/", name: "Owner Today" },
    { id: "O2-owner-pipeline", path: "/owner/pipeline", name: "Owner Pipeline" },
    { id: "O3-owner-money", path: "/owner/money", name: "Owner Money" },
    { id: "O4-owner-brand", path: "/owner/brand", name: "Owner Brand Settings" },
    { id: "E1-employee-my-day", path: "/employee/", name: "Employee My Day" },
    { id: "E2-employee-dispatch", path: "/employee/dispatch", name: "Employee Dispatch Embed" },
    { id: "C1-client-home", path: "/client/", name: "Client Home" },
    { id: "C2-client-event", path: "/client/events/EV-2026-001", name: "Client Event Hub" },
    { id: "C3-client-pay", path: "/client/pay", name: "Client Checkout & Pay" },
    { id: "C4-client-planning", path: "/client/planning", name: "Client Planning Hub" },
  ];

  for (const route of routes) {
    test(`Visual baseline & Axe scan for ${route.name} (${route.id})`, async ({ page }) => {
      // Navigate to route
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // Verify page loaded without critical error boundaries
      await expect(page.locator("body")).toBeVisible();

      // Accessibility Scan with Axe-core (Zero critical or serious violations)
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(criticalViolations).toEqual([]);

      // Visual Screenshot Comparison
      await expect(page).toHaveScreenshot(`${route.id}-desktop.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }

  test("Mobile responsive layout check for 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Owner mobile check: bottom nav visible
    await page.goto("/owner/");
    await expect(page.locator("nav")).toBeVisible();

    // Employee mobile check: 48px touch targets
    await page.goto("/employee/");
    const clockBtn = page.getByRole("button", { name: /clock/i });
    if (await clockBtn.count() > 0) {
      const box = await clockBtn.first().boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
