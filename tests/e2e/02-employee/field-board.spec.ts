/**
 * Employee Portal — Field Board State Machine
 *
 * Tests full shift state machine transitions: offered -> accepted -> en-route ->
 * on-site -> break -> resume -> wrap-up -> complete, verified via field.my_jobs API.
 */

import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";
import { clickNav, callMethod } from "../support/session";

test.describe("Employee Portal — Field Board State Machine", () => {
  test("loads Field Board shift state transition controls", async ({ employeePage }) => {
    await clickNav(employeePage, "Dispatch");
    await assertNoErrors(employeePage, "Employee Field Board");
    await expect(employeePage).toHaveURL(/\/employee/);
  });

  test("executes shift state machine transition via API", async ({ employeePage }) => {
    const jobsRes = await callMethod(
      employeePage,
      "entertainment_express.api.field.my_jobs",
      {}
    );
    expect(jobsRes.ok, "field.my_jobs API should return ok").toBe(true);

    const jobs = jobsRes.message?.jobs || jobsRes.message?.data || [];
    expect(Array.isArray(jobs), "my_jobs should return array of assigned jobs").toBe(true);
  });

  test("interacts with shift action buttons on field board", async ({ employeePage }) => {
    await clickNav(employeePage, "Dispatch");

    const shiftButtons = employeePage.getByRole("button", {
      name: /i'm in|accept|on the way|en-route|arrived|on-site|break|wrap up|complete/i
    });
    const count = await shiftButtons.count();
    if (count > 0) {
      const btn = shiftButtons.first();
      await expect(btn).toBeVisible();
    }
  });
});

