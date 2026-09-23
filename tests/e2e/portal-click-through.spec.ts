import { expect, test } from "@playwright/test";
import { CLIENT_PAGES, EMPLOYEE_PAGES, OWNER_PAGES } from "./pages";
import {
  PUBLIC_URL,
  assertShell,
  clickNav,
  login,
  navLabels,
  personas,
  watchPage,
} from "./support/session";

async function clickEveryPage(page: import("@playwright/test").Page, required: string[]) {
  const labels = await navLabels(page);
  for (const label of required) {
    expect(labels, `sidebar is missing "${label}"`).toContain(label);
  }
  for (const label of labels) {
    await clickNav(page, label);
    const tabs = page.getByRole("tab");
    const count = Math.min(await tabs.count(), 6);
    for (let i = 0; i < count; i += 1) {
      const tab = tabs.nth(i);
      if (!(await tab.isVisible())) continue;
      await tab.click();
      await assertShell(page, `${label} tab ${i + 1}`);
    }
  }
}

test.describe("live portal clicks", () => {
  test("owner clicks every sidebar page", async ({ page }) => {
    test.setTimeout(360_000);
    const watch = watchPage(page);
    await login(page, personas().owner);
    await clickEveryPage(page, OWNER_PAGES);
    watch.assertClean("owner pages");
  });

  test("employee clicks every sidebar page", async ({ page }) => {
    test.setTimeout(240_000);
    const watch = watchPage(page);
    await login(page, personas().employee);
    await clickEveryPage(page, EMPLOYEE_PAGES);
    watch.assertClean("employee pages");
  });

  test("client clicks every sidebar page", async ({ page }) => {
    test.setTimeout(240_000);
    const watch = watchPage(page);
    await login(page, personas().client);
    await clickEveryPage(page, CLIENT_PAGES);
    watch.assertClean("client pages");
  });

  test("public site clicks every homepage link", async ({ page }) => {
    test.setTimeout(420_000);
    const watch = watchPage(page);
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    const body = (await page.locator("body").innerText()) || "";
    expect(body, PUBLIC_URL).not.toContain("does not exist");
    const origin = new URL(PUBLIC_URL).origin;
    const hrefs = await page.locator("a[href]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href") || "")
    );
    const paths = [...new Set(hrefs)]
      .map((href) => {
        if (href.startsWith("/")) return href.split("#")[0];
        try {
          const url = new URL(href);
          if (url.origin === origin) return `${url.pathname}${url.search}`;
        } catch {
          return "";
        }
        return "";
      })
      .filter((href) => href.startsWith("/") && href !== "/")
      .filter((href) => !href.startsWith("/assets") && !href.startsWith("/files"))
      .filter((href) => !/\.(css|js|svg|png|jpe?g|webp|ico)(\?|$)/i.test(href))
      .filter((href) => !/logout|delete|cancel|purge/i.test(href));
    expect(paths.length).toBeGreaterThan(3);

    for (const path of paths) {
      await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
      const link = page.locator(`a[href="${path}"]`).first();
      await expect(link, path).toBeAttached();
      if (!(await link.isVisible())) {
        const opener = link.locator("xpath=ancestor::li[contains(@class,'has-dropdown')][1]/button").first();
        if (await opener.count()) {
          await opener.click();
        }
      }
      if (!(await link.isVisible())) {
        const menu = page.getByRole("button", { name: "Toggle navigation menu" });
        if (await menu.isVisible()) await menu.click();
      }
      await link.click();
      await page.waitForLoadState("domcontentloaded");
      const landed = (await page.locator("body").innerText()) || "";
      expect(landed, path).not.toContain("An unexpected error occurred while rendering this view");
      expect(landed, path).not.toContain("Internal Server Error");
      expect(landed, path).not.toContain("does not exist");
      expect(page.url(), path).not.toContain("chrome-error://");
    }
    watch.assertClean("public pages");
  });
});
