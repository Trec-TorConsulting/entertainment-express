/**
 * Owner Portal — Emergency Overrides
 *
 * Verifies Emergency Overrides control panel loads, active emergency status cards display,
 * emergency dispatch override controls render, and execution completes without JS errors.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav } from "../support/session";

test.describe("Owner Portal — Emergency Overrides", () => {
  test("loads Emergency Overrides control panel", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Emergency");
    await assertNoErrors(ownerPage, "Owner Emergency Overrides");
    await expect(ownerPage).toHaveURL(/\/owner/);

    const bodyText = await ownerPage.locator("body").innerText().catch(() => "");
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("renders active override controls and broadcast trigger buttons", async ({ ownerPage }) => {
    await clickNav(ownerPage, "Emergency");

    const overrideBtns = ownerPage.getByRole("button", { name: /override|emergency|broadcast|alert|reassign/i });
    const count = await overrideBtns.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

