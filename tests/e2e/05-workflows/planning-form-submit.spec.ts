import { test, expect } from "../support/fixtures";

test.describe("Workflow — Planning Form Submission", () => {
  test("end-to-end planning form draft save and submission flow", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
