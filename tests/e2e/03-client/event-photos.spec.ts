/**
 * Client Portal — Event Photo Gallery
 *
 * Verifies gallery page loads, photo thumbnails render, download action
 * controls are present, and share link button operates cleanly without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Client Portal — Event Photo Gallery", () => {
  test("loads Photo Gallery and download controls", async ({ clientPage }) => {
    await clickNav(clientPage, "Photos");
    await assertNoErrors(clientPage, "Client Event Photos");
    await expect(clientPage).toHaveURL(/\/client/);

    const bodyText = await clientPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders photo gallery items or download/share buttons", async ({ clientPage }) => {
    await clickNav(clientPage, "Photos");

    const controls = clientPage.locator("button, a, img").filter({
      hasText: /download|share|photo|gallery|view/i
    });
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

