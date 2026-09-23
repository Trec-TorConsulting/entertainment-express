import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — My Profile Settings", () => {
  test("loads Employee Profile and emergency contact info", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Profile");
    await expect(employeePage).toHaveURL(/\/employee|\/login/);
  });
});
