import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * System-Wide Multi-Role Portal Link & Error Crawler
 * Validates route navigation integrity, catches frontend JS exceptions, missing chunk 404s,
 * failed 4xx/5xx network requests, and React Error Boundaries across all portals on e2esmoke.
 */

interface ErrorRecord {
  portal: string;
  role: string;
  url: string;
  type: "console_error" | "page_exception" | "network_failure" | "error_boundary" | "dead_link";
  message: string;
  screenshotPath?: string;
}

interface VisitRecord {
  portal: string;
  role: string;
  url: string;
  status: "ok" | "error";
  linksFound: number;
}

const BASE_URL = process.env.EE_E2E_BASE || "https://admin.entx.app";
const ADMIN_PASSWORD = process.env.EE_ADMIN_PASSWORD || "admin";
const CRAWL_DELAY_MS = parseInt(process.env.EE_E2E_DELAY_MS || "300", 10);
const DESTRUCTIVE_REGEX = /delete|cancel|purge|destroy|reset|remove|charge|stripe/i;

const errorRegistry: ErrorRecord[] = [];
const visitRegistry: VisitRecord[] = [];

test.describe("System-Wide Portal Crawler & Health Suite", () => {
  test.beforeAll(async () => {
    // Ensure report directories exist
    const reportDir = path.join(__dirname, "reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Generate Markdown & HTML summary reports
    const reportDir = path.join(__dirname, "reports");
    const mdPath = path.join(reportDir, "system-crawler-report.md");
    const htmlPath = path.join(reportDir, "system-crawler-report.html");

    const totalVisited = visitRegistry.length;
    const totalErrors = errorRegistry.length;

    // Build Markdown report
    let md = `# System-Wide Portal Crawler Execution Report\n\n`;
    md += `- **Execution Time**: ${new Date().toISOString()}\n`;
    md += `- **Target Base URL**: ${BASE_URL}\n`;
    md += `- **Total Routes Visited**: ${totalVisited}\n`;
    md += `- **Total Errors Detected**: ${totalErrors}\n\n`;

    md += `## Visited Portal Summary\n\n`;
    md += `| Portal | Role | URL | Status | Links Discovered |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const v of visitRegistry) {
      md += `| ${v.portal} | ${v.role} | \`${v.url}\` | ${v.status === "ok" ? "✅ OK" : "❌ ERROR"} | ${v.linksFound} |\n`;
    }

    if (totalErrors > 0) {
      md += `\n## Detected Frontend Errors\n\n`;
      md += `| Portal | Role | URL | Error Type | Message |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      for (const err of errorRegistry) {
        md += `| ${err.portal} | ${err.role} | \`${err.url}\` | **${err.type}** | ${err.message.replace(/\|/g, "\\|").slice(0, 150)} |\n`;
      }
    } else {
      md += `\n## Results\n\n🎉 **Zero frontend errors, JS exceptions, or broken links detected!**\n`;
    }

    fs.writeFileSync(mdPath, md, "utf-8");

    // Build HTML report
    let html = `<!DOCTYPE html><html><head><title>System-Wide Portal Crawler Report</title>`;
    html += `<style>body{font-family:sans-serif;padding:2rem;background:#0f172a;color:#f8fafc;} table{width:100%;border-collapse:collapse;margin-top:1rem;} th,td{border:1px solid #334155;padding:8px;text-align:left;} th{background:#1e293b;} .badge-ok{color:#4ade80;} .badge-err{color:#f87171;}</style></head><body>`;
    html += `<h1>System-Wide Portal Crawler Report</h1>`;
    html += `<p>Base URL: <code>${BASE_URL}</code> | Visited: <strong>${totalVisited}</strong> | Errors: <strong>${totalErrors}</strong></p>`;
    html += `<h2>Visited Routes</h2><table><tr><th>Portal</th><th>Role</th><th>URL</th><th>Status</th><th>Links Found</th></tr>`;
    for (const v of visitRegistry) {
      html += `<tr><td>${v.portal}</td><td>${v.role}</td><td><code>${v.url}</code></td><td class="${v.status === "ok" ? "badge-ok" : "badge-err"}">${v.status.toUpperCase()}</td><td>${v.linksFound}</td></tr>`;
    }
    if (totalErrors > 0) {
      html += `<h2>Errors</h2><table><tr><th>Portal</th><th>Role</th><th>URL</th><th>Type</th><th>Details</th></tr>`;
      for (const err of errorRegistry) {
        html += `<tr><td>${err.portal}</td><td>${err.role}</td><td><code>${err.url}</code></td><td><strong>${err.type}</strong></td><td>${err.message}</td></tr>`;
      }
    }
    html += `</body></html>`;
    fs.writeFileSync(htmlPath, html, "utf-8");

    console.log(`[CRAWLER REPORT] Report generated at: ${mdPath}`);
  });

  const portalsToCrawl = [
    { name: "Owner Portal", role: "Owner", startPath: "/owner/" },
    { name: "Employee Portal", role: "Employee", startPath: "/employee/" },
    { name: "Customer Portal", role: "Customer", startPath: "/client/" },
    { name: "Public Website", role: "Guest", startPath: "/" },
  ];

  for (const portal of portalsToCrawl) {
    test(`Crawl & Health Gate for ${portal.name} (${portal.role})`, async ({ page }) => {
      // Step 1: Attach Telemetry Event Listeners
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const txt = msg.text();
          // Filter out expected auth failure attempts, tracebacks from failed login, or rate limits from console logs
          if (txt.includes("401") || txt.includes("429") || txt.includes("Too Many Requests") || txt.includes("Traceback (most recent call last)")) {
            return;
          }
          errorRegistry.push({
            portal: portal.name,
            role: portal.role,
            url: page.url(),
            type: "console_error",
            message: txt,
          });
        }
      });

      page.on("pageerror", (exception) => {
        errorRegistry.push({
          portal: portal.name,
          role: portal.role,
          url: page.url(),
          type: "page_exception",
          message: exception.message,
        });
      });

      page.on("response", (response) => {
        if (response.status() >= 400 && response.status() !== 401 && response.status() !== 403 && response.status() !== 429) {
          errorRegistry.push({
            portal: portal.name,
            role: portal.role,
            url: page.url(),
            type: "network_failure",
            message: `HTTP ${response.status()} on ${response.url()}`,
          });
        }
      });

      // Step 2: Attempt Authentication if non-guest
      if (portal.role !== "Guest") {
        try {
          await page.goto(`${BASE_URL}/login`);
          const userField = page.locator('input[name="usr"], input[type="text"]').first();
          const passField = page.locator('input[name="pwd"], input[type="password"]').first();
          if (await userField.isVisible()) {
            await userField.fill("Administrator");
            await passField.fill(ADMIN_PASSWORD);
            await page.click('button[type="submit"], button:has-text("Login")');
            await page.waitForTimeout(1000);
          }
        } catch {
          // If login page differs, continue crawl on target path
        }
      }

      // Step 3: Crawl Routes starting from portal root
      const visitedUrls = new Set<string>();
      const queue: string[] = [portal.startPath];

      while (queue.length > 0 && visitedUrls.size < 20) {
        const currentPath = queue.shift()!;
        if (visitedUrls.has(currentPath)) continue;
        visitedUrls.add(currentPath);

        const targetUrl = currentPath.startsWith("http") ? currentPath : `${BASE_URL}${currentPath}`;
        let status: "ok" | "error" = "ok";

        // Pace requests to avoid triggering rate limits
        await page.waitForTimeout(CRAWL_DELAY_MS);

        try {
          const res = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
          if (res && res.status() >= 400 && res.status() !== 429) {
            status = "error";
            errorRegistry.push({
              portal: portal.name,
              role: portal.role,
              url: targetUrl,
              type: "dead_link",
              message: `Page returned HTTP ${res.status()}`,
            });
          }

          // Check for React Error Boundary Fallback Screen
          const bodyText = (await page.locator("body").textContent()) || "";
          if (bodyText.includes("An unexpected error occurred while rendering this view") || (bodyText.includes("Something went wrong") && bodyText.includes("Your data is safe"))) {
            status = "error";
            const fontMonoText = (await page.locator(".font-mono").first().textContent()) || "React Error Boundary Triggered";
            errorRegistry.push({
              portal: portal.name,
              role: portal.role,
              url: targetUrl,
              type: "error_boundary",
              message: `React Error Boundary: ${fontMonoText.trim()}`,
            });
          }

          // Discover candidate navigation links
          const links = await page.locator("a[href]").all();
          let discoveredCount = 0;

          for (const link of links) {
            const href = await link.getAttribute("href");
            const text = (await link.textContent()) || "";

            if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
              continue;
            }

            // Action Safety Filter: Skip destructive buttons/links
            if (DESTRUCTIVE_REGEX.test(href) || DESTRUCTIVE_REGEX.test(text)) {
              continue;
            }

            // Normalize internal links within current portal namespace
            if (href.startsWith(portal.startPath) || (portal.startPath === "/" && href.startsWith("/"))) {
              discoveredCount++;
              if (!visitedUrls.has(href) && !queue.includes(href) && queue.length < 15) {
                queue.push(href);
              }
            }
          }

          visitRegistry.push({
            portal: portal.name,
            role: portal.role,
            url: currentPath,
            status,
            linksFound: discoveredCount,
          });
        } catch (err: any) {
          visitRegistry.push({
            portal: portal.name,
            role: portal.role,
            url: currentPath,
            status: "error",
            linksFound: 0,
          });

          errorRegistry.push({
            portal: portal.name,
            role: portal.role,
            url: targetUrl,
            type: "page_exception",
            message: `Navigation timeout or crash: ${err.message}`,
          });
        }
      }

      // Assert zero critical failures
      const criticalErrors = errorRegistry.filter(
        (e) => e.portal === portal.name && (e.type === "page_exception" || e.type === "error_boundary")
      );
      expect(criticalErrors).toEqual([]);
    });
  }
});
