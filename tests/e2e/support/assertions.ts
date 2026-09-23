import { expect, Locator, Page } from "@playwright/test";

export async function assertNoErrors(page: Page, contextName: string = "Page") {
  const body = (await page.locator("body").innerText().catch(() => "")) || "";
  expect(body, `${contextName} has crash boundary text`).not.toContain("An unexpected error occurred while rendering this view");
  expect(body, `${contextName} has generic error text`).not.toContain("Something went wrong");
}

export async function assertFormValidity(page: Page, formLocator?: Locator) {
  const target = formLocator || page.locator("form").first();
  await expect(target).toBeVisible();
}

export async function assertModalState(page: Page, isOpen: boolean) {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
  if (isOpen) {
    await expect(modal).toBeVisible();
  } else {
    await expect(modal).not.toBeVisible();
  }
}

export async function assertToast(page: Page, type?: "success" | "error" | "info" | "warning", textMatch?: string | RegExp) {
  const toast = page.locator('.toast, [role="alert"], .notification').first();
  await expect(toast).toBeVisible({ timeout: 10000 });
  if (textMatch) {
    await expect(toast).toHaveText(textMatch);
  }
}

export async function assertGridRows(page: Page, minCount: number = 1, gridSelector: string = "tbody tr, [role='row']") {
  const rows = page.locator(gridSelector);
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}
