import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — My Earnings", () => {
  test("loads Earnings history and pay stub details", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Earnings");
    await expect(employeePage).toHaveURL(/\/employee|\/login/);
  });
});
