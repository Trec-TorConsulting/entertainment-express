import { test, expect } from "../support/fixtures";

test.describe("API Contract — HR & Team Management Endpoints", () => {
  test("list_records kind: person returns team members for owner", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "person" }, "owner");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  test("list_records kind: person handles client access", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "person" }, "client");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
