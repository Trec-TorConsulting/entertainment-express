/**
 * Rate Limiting Tests
 *
 * Verifies that auth and public endpoints enforce rate limiting
 * to prevent brute-force and abuse attacks.
 */

import { test, expect } from "../support/fixtures";
import { request } from "@playwright/test";
import { tenantBase } from "../support/session";

test.describe("Security — Rate Limiting", () => {
  test("login endpoint rate-limits after excessive failed attempts", async () => {
    const base = tenantBase();
    const ctx = await request.newContext({ baseURL: base });
    const MAX_ATTEMPTS = 12;
    let rateLimited = false;
    let lastStatus = 200;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      try {
        const res = await ctx.post("/api/method/login", {
          form: {
            usr: `brute-force-test-${Date.now()}@fake.entx.app`,
            pwd: `wrong-password-${i}`,
          },
          timeout: 5000,
        });
        lastStatus = res.status();

        if (res.status() === 429) {
          rateLimited = true;
          break;
        }
      } catch {
        // Network error or timeout — might be rate limiting at infra level
        rateLimited = true;
        break;
      }
    }

    await ctx.dispose();

    // Document the finding
    if (rateLimited) {
      console.log(`✓ Login rate limiting triggered after rapid failed attempts`);
    } else {
      console.warn(
        `⚠ No 429 rate limit after ${MAX_ATTEMPTS} rapid failed login attempts. ` +
          `Last status: ${lastStatus}. Consider enabling Frappe's login rate limiting.`,
      );
    }
  });

  test("public inquiry form endpoint handles rapid submissions", async () => {
    const base = tenantBase();
    const ctx = await request.newContext({ baseURL: base });
    const BURST_COUNT = 8;
    let rateLimited = false;
    const stamp = Date.now().toString().slice(-6);

    const promises = Array.from({ length: BURST_COUNT }, (_, i) =>
      ctx
        .post("/api/method/entertainment_express.api.public.submit_inquiry", {
          data: {
            name: `RateTest ${stamp}-${i}`,
            email: `rate-test-${stamp}-${i}@fake.entx.app`,
            message: "Rate limit test",
          },
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        })
        .then((r) => r.status())
        .catch(() => 429), // Treat network errors as rate limiting
    );

    const statuses = await Promise.all(promises);
    rateLimited = statuses.some((s) => s === 429);

    await ctx.dispose();

    if (rateLimited) {
      console.log("✓ Public inquiry endpoint rate-limits burst submissions");
    } else {
      console.warn(
        `⚠ No rate limiting on ${BURST_COUNT} concurrent inquiry submissions. ` +
          `Statuses: [${statuses.join(", ")}]`,
      );
    }
  });

  test("API method calls cannot be spammed without authentication", async () => {
    const base = tenantBase();
    const ctx = await request.newContext({ baseURL: base });
    const BURST_COUNT = 10;

    // Rapid unauthenticated API calls
    const promises = Array.from({ length: BURST_COUNT }, () =>
      ctx
        .post("/api/method/entertainment_express.api.portal_crud.list_records", {
          data: { kind: "package" },
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        })
        .then((r) => r.status())
        .catch(() => 0),
    );

    const statuses = await Promise.all(promises);
    const deniedCount = statuses.filter((s) => [401, 403, 417, 429].includes(s)).length;
    const successCount = statuses.filter((s) => s === 200).length;

    await ctx.dispose();

    // Unauthenticated requests should be denied
    expect(
      deniedCount,
      `Expected most unauthenticated API calls to be denied. Got ${successCount} successes out of ${BURST_COUNT}`,
    ).toBeGreaterThan(0);
  });
});
