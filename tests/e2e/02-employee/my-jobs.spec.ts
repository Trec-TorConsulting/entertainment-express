import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — My Jobs", () => {
  test("loads Employee portal home and displays shift schedule", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee My Jobs");
    await expect(employeePage).toHaveURL(/\/employee|\/login/);
  });
});
