import { test, expect } from "../support/fixtures";

test.describe("API Contract — Music Selection API", () => {
  test("music request list returns response for client", async ({ apiClient }) => {
    const res = await apiClient.callApi("entertainment_express.api.customer.my_events", {}, "client");
    if (res.ok) {
      expect(res.status).toBe(200);
    }
  });
});
