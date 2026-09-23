import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — Shift Execution Lifecycle", () => {
  test("employee views job details without errors", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Shift Execution");
  });
});
