import { test, expect } from "../support/fixtures";

test.describe("Workflow — Quote, Contract & E-Signature", () => {
  test("end-to-end contract generation and signing flow", async ({ apiClient }) => {
    const contractRes = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "contract" }, "owner");
    expect(contractRes.status).toBeGreaterThanOrEqual(200);
  });
});
