/**
 * Global Teardown — runs after all Playwright tests complete.
 *
 * Cleans up any residual test data that wasn't deleted during individual
 * test teardowns. Uses the portal_crud API to find and delete records
 * matching the QA test naming convention (prefix "QA ").
 */

import { FullConfig } from "@playwright/test";
import { request } from "@playwright/test";

async function cleanupQARecords() {
  const base = (process.env.EE_E2E_BASE || "https://entx.app").replace(/\/$/, "");
  const ownerEmail = process.env.EE_OWNER_EMAIL;
  const ownerPassword = process.env.EE_OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    console.log("[Global Teardown] No owner credentials — skipping QA data cleanup.");
    return;
  }

  const ctx = await request.newContext({ baseURL: base });

  try {
    // Login as owner
    await ctx.post("/api/method/login", {
      form: { usr: ownerEmail, pwd: ownerPassword },
      timeout: 10000,
    });
  } catch (err) {
    console.warn("[Global Teardown] Login failed — skipping cleanup.");
    await ctx.dispose();
    return;
  }

  const deletableKinds = ["package", "inquiry", "gear", "vehicle", "safety_certificate"];

  for (const kind of deletableKinds) {
    try {
      const listRes = await ctx.post(
        "/api/method/entertainment_express.api.portal_crud.list_records",
        {
          data: { kind },
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        },
      );

      if (!listRes.ok()) continue;
      const body = await listRes.json().catch(() => null);
      const rows = body?.message?.rows || [];

      const qaRows = rows.filter((r: Record<string, string>) => {
        const name =
          r.item_name || r.contact_name || r.asset_name || r.vehicle_name || r.certificate_name || r.event_name || "";
        return name.startsWith("QA ") || name.startsWith("E2E ");
      });

      for (const row of qaRows) {
        try {
          await ctx.post("/api/method/entertainment_express.api.portal_crud.delete_record", {
            data: { kind, name: row.id || row.name },
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          });
          console.log(`[Global Teardown] Deleted ${kind}: ${row.id || row.name}`);
        } catch {
          // Ignore deletion failures — record may be non-deletable or already gone
        }
      }
    } catch {
      // Ignore list failures
    }
  }

  // Also clean up QA jobs (Event Bookings) — separate because they may have dependencies
  try {
    const jobRes = await ctx.post("/api/method/entertainment_express.api.portal_crud.list_records", {
      data: { kind: "job" },
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    if (jobRes.ok()) {
      const body = await jobRes.json().catch(() => null);
      const rows = body?.message?.rows || [];
      const qaJobs = rows.filter(
        (r: Record<string, string>) =>
          (r.event_name || "").startsWith("QA ") || (r.event_name || "").startsWith("E2E "),
      );
      for (const job of qaJobs) {
        try {
          await ctx.post("/api/method/entertainment_express.api.portal_crud.delete_record", {
            data: { kind: "job", name: job.id || job.name },
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          });
          console.log(`[Global Teardown] Deleted job: ${job.id || job.name}`);
        } catch {
          // Jobs may not support delete — that's OK
        }
      }
    }
  } catch {
    // Ignore
  }

  await ctx.dispose();
  console.log("[Global Teardown] QA data cleanup complete.");
}

export default async function globalTeardown(config: FullConfig) {
  console.log("[Global Teardown] Starting cleanup...");
  await cleanupQARecords();
}
