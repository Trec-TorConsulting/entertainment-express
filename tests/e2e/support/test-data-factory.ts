/**
 * Test Data Factory — Programmatic creation and cleanup of domain objects.
 *
 * Creates real records via the portal_crud API. Each factory method returns
 * a handle with the created record's name/id. All handles are tracked for
 * automatic cleanup via `dispose()`.
 *
 * Usage:
 *   const factory = new TestDataFactory(apiClient);
 *   const pkg = await factory.createPackage({ item_name: "DJ Gold" });
 *   // ... test with pkg.name ...
 *   await factory.dispose(); // deletes all created records
 */

import { ApiClient } from "./api-client";

export interface CreatedRecord {
  kind: string;
  name: string;
  data: Record<string, unknown>;
}

export class TestDataFactory {
  private client: ApiClient;
  private created: CreatedRecord[] = [];
  private stamp: string;

  constructor(client: ApiClient) {
    this.client = client;
    this.stamp = Date.now().toString().slice(-8);
  }

  /** Unique suffix for this factory instance */
  get uniqueStamp(): string {
    return this.stamp;
  }

  /** All records created by this factory, in creation order */
  get records(): readonly CreatedRecord[] {
    return this.created;
  }

  // ── Package (Item) ────────────────────────────────────────────────
  async createPackage(overrides: Partial<{
    item_name: string;
    rate: number;
    unit: string;
    description: string;
  }> = {}): Promise<CreatedRecord> {
    const values = {
      item_name: overrides.item_name ?? `QA Pkg ${this.stamp}`,
      rate: overrides.rate ?? 1500,
      unit: overrides.unit ?? "event",
      description: overrides.description ?? `Auto-created by E2E test factory ${this.stamp}`,
    };
    return this._save("package", values);
  }

  // ── Inquiry (Lead) ────────────────────────────────────────────────
  async createInquiry(overrides: Partial<{
    contact_name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
  }> = {}): Promise<CreatedRecord> {
    const values = {
      contact_name: overrides.contact_name ?? `QA Lead ${this.stamp}`,
      email: overrides.email ?? `qa-${this.stamp}@test.entx.app`,
      phone: overrides.phone ?? "",
      status: overrides.status ?? "New",
      notes: overrides.notes ?? `Auto-created by E2E factory ${this.stamp}`,
    };
    return this._save("inquiry", values);
  }

  // ── Job (Event Booking) ───────────────────────────────────────────
  async createJob(overrides: Partial<{
    event_name: string;
    customer_name: string;
    event_date: string;
    start_time: string;
    end_time: string;
    venue_address: string;
    status: string;
    notes: string;
  }> = {}): Promise<CreatedRecord> {
    const today = new Date().toISOString().slice(0, 10);
    const values = {
      event_name: overrides.event_name ?? `QA Event ${this.stamp}`,
      customer_name: overrides.customer_name ?? `QA Client ${this.stamp}`,
      event_date: overrides.event_date ?? today,
      start_time: overrides.start_time ?? "18:00:00",
      end_time: overrides.end_time ?? "22:00:00",
      venue_address: overrides.venue_address ?? "123 Test St, Testville, TX 75001",
      status: overrides.status ?? "Confirmed",
      notes: overrides.notes ?? `Auto-created by E2E factory ${this.stamp}`,
    };
    return this._save("job", values);
  }

  // ── Gear (Service Asset) ──────────────────────────────────────────
  async createGear(overrides: Partial<{
    asset_name: string;
    asset_type: string;
    status: string;
    condition: string;
    barcode: string;
    notes: string;
  }> = {}): Promise<CreatedRecord> {
    const values = {
      asset_name: overrides.asset_name ?? `QA Gear ${this.stamp}`,
      asset_type: overrides.asset_type ?? "Booth",
      status: overrides.status ?? "available",
      condition: overrides.condition ?? "excellent",
      barcode: overrides.barcode ?? `QA-${this.stamp}`,
      notes: overrides.notes ?? `Auto-created by E2E factory ${this.stamp}`,
    };
    return this._save("gear", values);
  }

  // ── Vehicle (Fleet) ───────────────────────────────────────────────
  async createVehicle(overrides: Partial<{
    vehicle_name: string;
    plate: string;
    vin: string;
    vehicle_type: string;
    status: string;
    max_payload_lb: number;
  }> = {}): Promise<CreatedRecord> {
    const values = {
      vehicle_name: overrides.vehicle_name ?? `QA Van ${this.stamp}`,
      plate: overrides.plate ?? `QA-${this.stamp.slice(0, 4)}`,
      vin: overrides.vin ?? "",
      vehicle_type: overrides.vehicle_type ?? "van",
      status: overrides.status ?? "active",
      max_payload_lb: overrides.max_payload_lb ?? 2000,
    };
    return this._save("vehicle", values);
  }

  // ── Safety Certificate ────────────────────────────────────────────
  async createSafetyCertificate(overrides: Partial<{
    certificate_name: string;
    certificate_number: string;
    issuing_body: string;
    expiry_date: string;
    issue_date: string;
    status: string;
  }> = {}): Promise<CreatedRecord> {
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    const values = {
      certificate_name: overrides.certificate_name ?? `QA Cert ${this.stamp}`,
      certificate_number: overrides.certificate_number ?? `CERT-${this.stamp}`,
      issuing_body: overrides.issuing_body ?? "QA Authority",
      expiry_date: overrides.expiry_date ?? nextYear,
      issue_date: overrides.issue_date ?? new Date().toISOString().slice(0, 10),
      status: overrides.status ?? "Active",
    };
    return this._save("safety_certificate", values);
  }

  // ── Generic CRUD ──────────────────────────────────────────────────

  private async _save(kind: string, values: Record<string, unknown>): Promise<CreatedRecord> {
    const res = await this.client.callApi(
      "entertainment_express.api.portal_crud.save_record",
      { kind, values: JSON.stringify(values) },
      "owner",
    );

    const name = res.message?.name || res.raw?.message?.name || "";
    const record: CreatedRecord = { kind, name, data: values };
    this.created.push(record);
    return record;
  }

  /** Update an existing record */
  async updateRecord(kind: string, name: string, values: Record<string, unknown>): Promise<CreatedRecord> {
    const res = await this.client.callApi(
      "entertainment_express.api.portal_crud.save_record",
      { kind, name, values: JSON.stringify(values) },
      "owner",
    );

    const updatedName = res.message?.name || res.raw?.message?.name || name;
    return { kind, name: updatedName, data: values };
  }

  /** Fetch a single record */
  async getRecord(kind: string, name: string) {
    return this.client.callApi(
      "entertainment_express.api.portal_crud.get_record",
      { kind, name },
      "owner",
    );
  }

  /** List records of a kind */
  async listRecords(kind: string) {
    return this.client.callApi(
      "entertainment_express.api.portal_crud.list_records",
      { kind },
      "owner",
    );
  }

  // ── Cleanup ───────────────────────────────────────────────────────

  /**
   * Delete all records created by this factory, in reverse creation order.
   * Silently ignores deletion failures (record may have been deleted by test).
   */
  async dispose(): Promise<void> {
    const reversed = [...this.created].reverse();
    for (const record of reversed) {
      if (!record.name) continue;
      try {
        await this.client.callApi(
          "entertainment_express.api.portal_crud.delete_record",
          { kind: record.kind, name: record.name },
          "owner",
        );
      } catch {
        // Ignore — record may have been deleted by the test or be non-deletable
      }
    }
    this.created = [];
  }
}
