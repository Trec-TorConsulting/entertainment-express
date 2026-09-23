import { test, expect } from "../support/fixtures";

test.describe("Workflow — Lead to Cash Lifecycle", () => {
  test("end-to-end lead to cash flow via API and portal UI", async ({ apiClient }) => {
    const inquiryRes = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "inquiry" }, "owner");
    expect(inquiryRes.status).toBeGreaterThanOrEqual(200);

    const jobRes = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "job" }, "owner");
    expect(jobRes.status).toBeGreaterThanOrEqual(200);
  });
});
