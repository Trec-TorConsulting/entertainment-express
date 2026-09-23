import { expect, test } from "@playwright/test";
import { callMethod, clickNav, login, personas, watchPage } from "./support/session";

test("golden path saves package, booking, crew, milestone, and invoice", async ({ page }) => {
  test.setTimeout(420_000);
  const watch = watchPage(page);
  const { owner, employee } = personas();
  const stamp = Date.now().toString().slice(-6);
  const packageName = `QA Package ${stamp}`;
  const leadName = `QA Client ${stamp}`;
  const eventName = `QA Event ${stamp}`;
  const eventDate = new Date().toISOString().slice(0, 10);

  await login(page, owner);

  await clickNav(page, "Packages");
  await page.getByRole("button", { name: "Create Package" }).first().click();
  const packageDialog = page.getByRole("dialog", { name: "Create New Catalog Package" });
  await packageDialog.getByLabel("Package Title").fill(packageName);
  await packageDialog.getByLabel("Package Base Rate ($)").fill("1800");
  await packageDialog.getByRole("button", { name: "Save Package" }).click();
  await expect(packageDialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText(packageName).first()).toBeVisible();

  const packages = await callMethod(page, "entertainment_express.api.portal_crud.list_records", { kind: "package" });
  expect(packages.ok, JSON.stringify(packages.message)).toBeTruthy();
  const packageRows = packages.message?.rows || [];
  expect(packageRows.some((row: { item_name?: string; name?: string }) => (row.item_name || row.name) === packageName)).toBeTruthy();

  await clickNav(page, "Pipeline");
  await page.getByRole("button", { name: "+ New Inquiry" }).click();
  const inquiryDialog = page.getByRole("dialog", { name: "New Client Inquiry" });
  await inquiryDialog.getByLabel("Client / Contact Name").fill(leadName);
  await inquiryDialog.getByLabel("Email Address").fill(`qa-${stamp}@example.com`);
  await inquiryDialog.getByRole("button", { name: "Create Deal" }).click();
  await expect(inquiryDialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText(leadName).first()).toBeVisible();

  await page.getByPlaceholder("Filter deals by client, event, or status...").fill(leadName);
  await page.getByRole("button", { name: "Review" }).first().click();
  await page.getByRole("button", { name: "Edit Deal" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Pipeline Deal" });
  await editDialog.getByLabel("Pipeline Status").selectOption("Booked");
  await editDialog.getByRole("button", { name: "Save Changes" }).click();
  await expect(editDialog).toBeHidden({ timeout: 20_000 });

  const leads = await callMethod(page, "entertainment_express.api.portal_crud.list_records", { kind: "inquiry" });
  const leadRows = leads.message?.rows || [];
  const lead = leadRows.find((row: { contact_name?: string }) => row.contact_name === leadName);
  expect(lead, "lead was not saved").toBeTruthy();
  expect(lead.status).toBe("Booked");

  await clickNav(page, "Calendar");
  await page.getByRole("button", { name: "Add Booking" }).click();
  const bookingDialog = page.getByRole("dialog", { name: "Schedule New Booking" });
  await bookingDialog.getByLabel("Event Name").fill(eventName);
  await bookingDialog.getByLabel("Client Host Name").fill(leadName);
  await bookingDialog.getByLabel("Event Date").fill(eventDate);
  await bookingDialog.getByLabel("Contract Total ($)").fill("2500");
  await bookingDialog.getByRole("button", { name: "Save Booking" }).click();
  await expect(bookingDialog).toBeHidden({ timeout: 20_000 });

  const jobs = await callMethod(page, "entertainment_express.api.portal_crud.list_records", { kind: "job" });
  const jobRows = jobs.message?.rows || [];
  const job = jobRows.find((row: { event_name?: string }) => row.event_name === eventName);
  expect(job, "booking was not saved").toBeTruthy();
  expect(String(job.status).toLowerCase()).toContain("confirm");

  await clickNav(page, "Dispatch");
  await page.getByLabel("Day").fill(eventDate);
  const card = page.locator("article", { hasText: eventName });
  await expect(card).toBeVisible({ timeout: 20_000 });
  const person = card.getByLabel("Person");
  const optionLabels = await person.locator("option").allTextContents();
  const crewName = optionLabels.find((label) => label.includes("QA Employee"));
  expect(crewName, `QA Employee is not on the dispatch roster (${optionLabels.join(", ") || "empty"}). Run scripts/seed_qa_personas.py`).toBeTruthy();
  await person.selectOption({ label: crewName! });
  await card.getByRole("button", { name: "Offer shift" }).click();
  await expect(card.getByText("Waiting on them")).toBeVisible({ timeout: 20_000 });

  const crew = await callMethod(page, "entertainment_express.api.portal_dispatch.job_crew", { job: job.id });
  const crewRows = Array.isArray(crew.message) ? crew.message : [];
  expect(crewRows.some((row: { status_key?: string; person?: string }) => row.status_key === "offered" && String(row.person).includes("QA Employee"))).toBeTruthy();

  await login(page, employee);
  await clickNav(page, "Field Board");
  const shift = page.locator("article", { hasText: eventName });
  await expect(shift).toBeVisible({ timeout: 20_000 });
  await shift.getByRole("button", { name: "I'm in" }).click();
  await expect(shift.getByRole("button", { name: "On the way" })).toBeVisible({ timeout: 20_000 });
  await shift.getByRole("button", { name: "On the way" }).click();
  await expect(shift).toContainText(/en route/i, { timeout: 20_000 });

  const shifts = await callMethod(page, "entertainment_express.api.field.my_jobs");
  const mine = (Array.isArray(shifts.message) ? shifts.message : []).find(
    (row: { job?: string }) => row.job === eventName
  );
  expect(mine, "employee shift was not saved").toBeTruthy();
  expect(mine.stage).toBe("en-route");

  await login(page, owner);
  await clickNav(page, "Money");
  await page.getByRole("button", { name: "+ Create Invoice" }).click();
  const invoiceDialog = page.getByRole("dialog", { name: "Create balance invoice" });
  await invoiceDialog.getByLabel("Booking").selectOption({ label: eventName });
  await invoiceDialog.getByRole("button", { name: "Create balance invoice" }).click();
  await expect(invoiceDialog.getByText(/^Invoice /)).toBeVisible({ timeout: 20_000 });

  watch.assertClean("golden path");
});
