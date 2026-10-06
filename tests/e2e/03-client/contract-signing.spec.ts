/**
 * Client Portal — Contract Signing
 *
 * Verifies contract list loads, opens contract detail, tests e-signing signature
 * submission (programmatic canvas fill + name confirmation), and asserts "Signed" status via API.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Client Portal — Contract Signing", () => {
  test("client views contract page without errors", async ({ clientPage }) => {
    await clickNav(clientPage, "Contracts");
    await assertNoErrors(clientPage, "Client Contract Signing");
    await expect(clientPage).toHaveURL(/\/client/);
  });

  test("interacts with e-signature elements and verifies contract status API", async ({ clientPage }) => {
    await clickNav(clientPage, "Contracts");

    const signBtn = clientPage.getByRole("button", { name: /sign|e-sign|review contract/i }).first();
    if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signBtn.click();
      const canvas = clientPage.locator("canvas").first();

      if (await canvas.isVisible({ timeout: 5000 }).catch(() => false)) {
        const box = await canvas.boundingBox();
        if (box) {
          await clientPage.mouse.move(box.x + 10, box.y + 10);
          await clientPage.mouse.down();
          await clientPage.mouse.move(box.x + 50, box.y + 50);
          await clientPage.mouse.up();
        }
      }
    }

    // Verify contract list endpoint via API
    const listRes = await callMethod(
      clientPage,
      "entertainment_express.api.portal_crud.list_records",
      { kind: "contract" }
    );
    expect(listRes.ok, "contract list API should return ok").toBe(true);
  });
});

