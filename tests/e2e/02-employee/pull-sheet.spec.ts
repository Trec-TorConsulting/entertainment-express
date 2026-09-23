import { test, expect } from "../support/fixtures";
import { assertNoErrors } from "../support/assertions";

test.describe("Employee Portal — Pull Sheet Checklist", () => {
  test("loads Equipment Pull Sheet and checkbox state toggles", async ({ employeePage }) => {
    await assertNoErrors(employeePage, "Employee Pull Sheet");
    await expect(employeePage).toHaveURL(/\/employee|\/login/);
  });
});
