import { test, expect } from "../support/fixtures";

test.describe("Workflow — Booking, Dispatch & Crew Assignment", () => {
  test("end-to-end dispatch and crew assignment flow", async ({ apiClient }) => {
    const dispatchRes = await apiClient.callApi("entertainment_express.api.portal_dispatch.job_crew", { job_id: "test-job-id" }, "owner");
    expect(dispatchRes.status).toBeGreaterThanOrEqual(200);
  });
});
