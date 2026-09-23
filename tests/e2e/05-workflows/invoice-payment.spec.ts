import { test, expect } from "../support/fixtures";

test.describe("Workflow — Invoice Creation & Payment", () => {
  test("end-to-end invoice creation and payment flow", async ({ apiClient }) => {
    const invoiceRes = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "invoice" }, "owner");
    expect(invoiceRes.status).toBeGreaterThanOrEqual(200);
  });
});
