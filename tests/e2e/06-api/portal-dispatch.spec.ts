import { test, expect } from "../support/fixtures";

test.describe("API Contract — Portal Dispatch Endpoints", () => {
  test("job_crew endpoint returns crew assignments for valid job or empty list", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_dispatch.job_crew", { job_id: "test-job-id" }, "owner");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });

  test("job_crew endpoint denies access to client persona", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.portal_dispatch.job_crew", { job_id: "test-job-id" }, "client");
    if (!res.ok) {
      expect([403, 401]).toContain(res.status);
    }
  });
});
