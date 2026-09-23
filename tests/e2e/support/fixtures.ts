import { test as base, Page } from "@playwright/test";
import { login, watchPage, personas, PUBLIC_URL, tenantBase } from "./session";
import { ApiClient } from "./api-client";

type TestFixtures = {
  ownerPage: Page;
  employeePage: Page;
  clientPage: Page;
  guestPage: Page;
  apiClient: ApiClient;
};

export const test = base.extend<TestFixtures>({
  ownerPage: async ({ page }, use) => {
    const watcher = watchPage(page);
    const p = personas();
    await login(page, p.owner);
    await use(page);
    watcher.assertClean("Owner Page Teardown");
  },

  employeePage: async ({ page }, use) => {
    const watcher = watchPage(page);
    const p = personas();
    await login(page, p.employee);
    await use(page);
    watcher.assertClean("Employee Page Teardown");
  },

  clientPage: async ({ page }, use) => {
    const watcher = watchPage(page);
    const p = personas();
    await login(page, p.client);
    await use(page);
    watcher.assertClean("Client Page Teardown");
  },

  guestPage: async ({ page }, use) => {
    const watcher = watchPage(page);
    await page.goto(PUBLIC_URL, { waitUntil: "domcontentloaded" });
    await use(page);
    watcher.assertClean("Guest Page Teardown");
  },

  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await use(client);
    await client.dispose();
  },
});

export { expect } from "@playwright/test";
