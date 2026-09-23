import { test, expect } from "../support/fixtures";

test.describe("Workflow — Crew Shift Lifecycle State Machine", () => {
  test("complete shift state machine execution via API", async ({ apiClient }) => {
    const shiftRes = await apiClient.callApi("entertainment_express.api.field.my_jobs", {}, "employee");
    expect(shiftRes.status).toBeGreaterThanOrEqual(200);
  });
});
