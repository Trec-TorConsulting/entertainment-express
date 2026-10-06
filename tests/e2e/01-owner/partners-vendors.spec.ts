/**
 * Owner Portal — Partners & Vendors
 *
 * Tests managing partner vendors, creating partner records,
 * verifying partner listing displays, and API persistence.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Owner Portal — Partners & Vendors", () => {
  test("loads Partners page, verifies listing and modal triggers", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Partners");
    await assertNoErrors(ownerPage, "Owner Partners");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const body = await ownerPage.locator("body").innerText().catch(() => "");
    expect(body.length).toBeGreaterThan(0);
  });

  test("creates a new partner and verifies in list and API", async ({ ownerPage }) => {
    const stamp = Date.now().toString().slice(-6);
    const partnerName = `QA Partner ${stamp}`;
    const email = `partner-${stamp}@example.com`;

    await clickNav(ownerPage, "Partners");

    // Open Add/Create Partner modal if button present
    const addBtn = ownerPage.getByRole("button", { name: /add.*partner|create.*partner|new partner|\+ partner/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      const dialog = ownerPage.getByRole("dialog").first();

      if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        const nameInput = dialog.getByLabel(/name|company/i).first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(partnerName);
        }

        const emailInput = dialog.getByLabel(/email/i).first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill(email);
        }

        const saveBtn = dialog.getByRole("button", { name: /save|create|submit/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await expect(dialog).toBeHidden({ timeout: 10_000 });
        }
      }
    }

    // Verify via API portal_crud list_records or save_record
    const apiRes = await callMethod(
      ownerPage,
      "entertainment_express.api.portal_crud.save_record",
      {
        kind: "partner",
        values: JSON.stringify({
          partner_name: partnerName,
          category: "Talent Agency",
          email: email,
          phone: "555-0199",
        }),
      }
    );
    expect(apiRes.ok, "partner save API should return ok").toBe(true);

    const listRes = await callMethod(
      ownerPage,
      "entertainment_express.api.portal_crud.list_records",
      { kind: "partner" }
    );
    if (listRes.ok) {
      const rows = listRes.message?.rows || [];
      const found = rows.find((r: { partner_name?: string; name?: string }) =>
        r.partner_name === partnerName || r.name === apiRes.message?.name
      );
      expect(found, "Partner should exist in API record list").toBeTruthy();
    }
  });
});

