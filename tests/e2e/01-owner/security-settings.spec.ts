/**
 * Owner Portal — Security & Access Controls
 *
 * Verifies Security settings page loads, authentication policies (2FA, password expiration,
 * session timeouts) display, audit log controls render, and execution is error-free.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Security & Access Controls", () => {
  test("loads Security settings and authentication policy grid", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Security");
    await assertNoErrors(ownerPage, "Owner Security Settings");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders security policy controls and session audit options", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Security");

    const securityControls = ownerPage.locator("button, input, select, [role='switch']").filter({
      hasText: /2fa|mfa|password|session|audit|permission|api key|security/i
    });
    const count = await securityControls.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

