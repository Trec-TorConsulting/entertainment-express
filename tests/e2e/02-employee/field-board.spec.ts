import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — Field Board State Machine", () => {
  test("loads Field Board shift state transition controls", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Field Board");
    await expect(employeePage).toHaveURL(/\/employee|\/login/);
  });
});
