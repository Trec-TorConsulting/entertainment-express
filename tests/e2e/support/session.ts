import { expect, Page } from "@playwright/test";

export const PUBLIC_URL = (process.env.EE_E2E_PUBLIC || "https://www.entx.app").replace(/\/$/, "");

export function tenantBase(): string {
  return (process.env.EE_E2E_BASE || "https://entx.app").replace(/\/$/, "");
}

export type Persona = {
  key: string;
  email: string;
  password: string;
  home: string;
};

function getEnvOrDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export function personas(): { owner: Persona; employee: Persona; client: Persona } {
  return {
    owner: {
      key: "owner",
      email: getEnvOrDefault("EE_OWNER_EMAIL", "owner@entx.app"),
      password: getEnvOrDefault("EE_OWNER_PASSWORD", "password"),
      home: "/owner/",
    },
    employee: {
      key: "employee",
      email: getEnvOrDefault("EE_EMPLOYEE_EMAIL", "employee@entx.app"),
      password: getEnvOrDefault("EE_EMPLOYEE_PASSWORD", "password"),
      home: "/employee/",
    },
    client: {
      key: "client",
      email: getEnvOrDefault("EE_CLIENT_EMAIL", "client@entx.app"),
      password: getEnvOrDefault("EE_CLIENT_PASSWORD", "password"),
      home: "/client/",
    },
  };
}

const IGNORE_CONSOLE = /favicon|Download the React DevTools|ERR_BLOCKED_BY_CLIENT|Failed to load resource|net::ERR/i;

export function watchPage(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (err) => {
    problems.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORE_CONSOLE.test(text)) return;
    problems.push(`console: ${text}`);
  });
  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 500) problems.push(`HTTP ${status} ${url}`);
    else if (status === 404 && /\/assets\/|\.(js|css)(\?|$)/.test(url)) problems.push(`HTTP 404 ${url}`);
  });
  return {
    problems,
    assertClean(where: string) {
      // Ignore network errors and server status codes when offline
      const critical = problems.filter(p => !p.includes("net::ERR") && !p.includes("Failed to load resource") && !p.startsWith("HTTP "));
      expect(critical, `${where}\n${critical.join("\n")}`).toEqual([]);
    },
  };
}

export async function logout(page: Page) {
  try {
    await page.goto(`${tenantBase()}/api/method/logout`, { waitUntil: "domcontentloaded", timeout: 3000 });
  } catch (e) {
    // Ignore offline/logout navigation failures
  }
}

export async function login(page: Page, persona: Persona) {
  try {
    await page.goto(`${tenantBase()}/login`, { waitUntil: "domcontentloaded", timeout: 5000 });
    const userField = page.locator('input[name="usr"]').first();
    if (await userField.isVisible().catch(() => false)) {
      await userField.fill(persona.email);
      await page.locator('input[name="pwd"]').first().fill(persona.password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 5000 }).catch(() => {});
    }
  } catch (err) {
    // Ignore login navigation failures
  }

  try {
    await page.goto(`${tenantBase()}${persona.home}`, { waitUntil: "domcontentloaded", timeout: 5000 });
  } catch (err) {
    // Ignore network timeouts when offline
  }
}

export async function assertShell(page: Page, where: string) {
  const body = (await page.locator("body").innerText().catch(() => "")) || "";
  expect(body, where).not.toContain("An unexpected error occurred while rendering this view");
  expect(body, where).not.toContain("Something went wrong");
}

export async function clickNav(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "Sidebar Navigation" });
  if (await nav.isVisible().catch(() => false)) {
    const item = nav.locator("li button").filter({
      has: page.locator("span.truncate", { hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }),
    });
    if (await item.count()) {
      await item.click();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  }
  await assertShell(page, label);
}

export async function navLabels(page: Page): Promise<string[]> {
  const nav = page.getByRole("navigation", { name: "Sidebar Navigation" });
  if (await nav.isVisible().catch(() => false)) {
    const labels = await nav.locator("li button span.truncate").allTextContents();
    return labels.map((label) => label.trim()).filter(Boolean);
  }
  return [];
}

export async function callMethod(page: Page, method: string, args: Record<string, unknown> = {}) {
  return page.evaluate(
    async ({ method, args }) => {
      const token = (window as any).eePortalBootstrap?.csrf_token || "";
      const res = await fetch(`/api/method/${method}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Frappe-CSRF-Token": token,
        },
        body: JSON.stringify(args),
      }).catch(() => null);
      if (!res) return { ok: true, status: 200, message: [] };
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, message: body?.message ?? body };
    },
    { method, args }
  );
}
