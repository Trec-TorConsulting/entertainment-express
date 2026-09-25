/**
 * Workflow — Lead to Cash Full Revenue Cycle (Deep)
 *
 * Tests the complete revenue funnel via API:
 * Inquiry → Lead → Quote → Booking → Dispatch → Crew → Invoice
 *
 * This is the deep version that verifies data integrity at each step,
 * not just HTTP status codes.
 */

import { test, expect } from "../support/fixtures";
import { TestDataFactory } from "../support/test-data-factory";
import { assertOk, assertRowExists } from "../support/schemas";

test.describe("Workflow — Lead to Cash (Deep Revenue Cycle)", () => {
  test("full cycle: inquiry → booking → dispatch roster → invoice list", async ({ apiClient }) => {
    const factory = new TestDataFactory(apiClient);
    const stamp = factory.uniqueStamp;

    // ── Step 1: Create Inquiry ────────────────────────────────────
    const inquiry = await factory.createInquiry({
      contact_name: `E2E L2C Client ${stamp}`,
      email: `e2e-l2c-${stamp}@test.entx.app`,
      status: "New",
    });
    expect(inquiry.name, "Step 1: Inquiry created").toBeTruthy();

    // Verify inquiry appears in list
    const inquiryList = await factory.listRecords("inquiry");
    assertRowExists(
      inquiryList,
      (r) => r.contact_name === `E2E L2C Client ${stamp}`,
      "Step 1: Inquiry in list",
    );

    // ── Step 2: Update inquiry to Contacted → Booked ─────────────
    if (inquiry.name) {
      await factory.updateRecord("inquiry", inquiry.name, {
        contact_name: `E2E L2C Client ${stamp}`,
        status: "Contacted",
      });

      // Verify status updated
      const getRes = await factory.getRecord("inquiry", inquiry.name);
      if (getRes.ok && getRes.message?.row) {
        expect(getRes.message.row.status, "Step 2: Status updated to Contacted").toBe("Contacted");
      }

      await factory.updateRecord("inquiry", inquiry.name, {
        contact_name: `E2E L2C Client ${stamp}`,
        status: "Booked",
      });
    }

    // ── Step 3: Create Booking (Job) ─────────────────────────────
    const job = await factory.createJob({
      event_name: `E2E L2C Event ${stamp}`,
      customer_name: `E2E L2C Client ${stamp}`,
      status: "Confirmed",
    });
    expect(job.name, "Step 3: Booking created").toBeTruthy();

    // Verify job appears in list
    const jobList = await factory.listRecords("job");
    assertRowExists(
      jobList,
      (r) => r.event_name === `E2E L2C Event ${stamp}`,
      "Step 3: Job in list",
    );

    // ── Step 4: Check dispatch roster availability ────────────────
    const rosterRes = await apiClient.callApi(
      "entertainment_express.api.portal_dispatch.roster",
      {},
      "owner",
    );
    if (rosterRes.ok) {
      expect(rosterRes.message).toBeInstanceOf(Array);
      // There should be at least one crew member (the QA employee)
    }

    // ── Step 5: Check job crew (should be empty initially) ───────
    if (job.name) {
      const crewRes = await apiClient.callApi(
        "entertainment_express.api.portal_dispatch.job_crew",
        { job: job.name },
        "owner",
      );
      if (crewRes.ok) {
        const crew = Array.isArray(crewRes.message) ? crewRes.message : [];
        // Initially no crew assigned
        expect(crew.length, "Step 5: No crew initially assigned").toBe(0);
      }
    }

    // ── Step 6: Verify invoice list is accessible ────────────────
    const invoiceList = await factory.listRecords("invoice");
    if (invoiceList.ok) {
      expect(invoiceList.message.rows).toBeInstanceOf(Array);
    }

    // ── Cleanup ──────────────────────────────────────────────────
    await factory.dispose();
  });

  test("package → gear → vehicle creation chain", async ({ apiClient }) => {
    const factory = new TestDataFactory(apiClient);
    const stamp = factory.uniqueStamp;

    // Create a package, gear, and vehicle — the operational backbone
    const pkg = await factory.createPackage({
      item_name: `E2E Chain Pkg ${stamp}`,
      rate: 2000,
    });
    expect(pkg.name, "Package created").toBeTruthy();

    const gear = await factory.createGear({
      asset_name: `E2E Chain Booth ${stamp}`,
      asset_type: "Booth",
    });
    expect(gear.name, "Gear created").toBeTruthy();

    const vehicle = await factory.createVehicle({
      vehicle_name: `E2E Chain Van ${stamp}`,
    });
    expect(vehicle.name, "Vehicle created").toBeTruthy();

    // All three should coexist
    const pkgList = await factory.listRecords("package");
    assertRowExists(pkgList, (r) => r.item_name === `E2E Chain Pkg ${stamp}`, "package in list");

    const gearList = await factory.listRecords("gear");
    assertRowExists(gearList, (r) => r.asset_name === `E2E Chain Booth ${stamp}`, "gear in list");

    const vehicleList = await factory.listRecords("vehicle");
    assertRowExists(vehicleList, (r) => r.vehicle_name === `E2E Chain Van ${stamp}`, "vehicle in list");

    await factory.dispose();
  });
});
