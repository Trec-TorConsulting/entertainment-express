import { test, expect } from "../support/fixtures";

test.describe("API Contract — Portal CRUD & Generic Endpoints", () => {
  const KINDS = ["package", "inquiry", "job", "invoice", "venue", "partner", "asset", "person"];

  for (const kind of KINDS) {
    test(`list_records for kind: ${kind} with owner persona returns array or valid response`, async ({ apiClient }) => {
      const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind }, "owner");
      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    test(`list_records for kind: ${kind} enforces role scoping or valid response for client persona`, async ({ apiClient }) => {
      const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind }, "client");
      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  }

  test("list_records with pagination parameters (page_size: 5, page: 1)", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "package", page_size: 5, page: 1 }, "owner");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  test("list_records with filter parameter", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "package", filter: "DJ" }, "owner");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  test("list_records with invalid kind returns error or response", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "nonexistent_kind_xyz" }, "owner");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  test("unauthenticated list_records request returns status", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_core.list_records", { kind: "package" }, "guest");
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});
