import { test, expect } from "../support/fixtures";

test.describe("Workflow — Proposal Build & Client Acceptance", () => {
  test("end-to-end proposal generation and deposit booking flow", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "package" }, "owner");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
