/**
 * API Response Schema Validators
 *
 * Lightweight runtime schema validation for API responses.
 * Uses a minimal assertion approach (no Zod dependency) that integrates
 * cleanly with Playwright's expect() for readable error messages.
 */

import { expect } from "@playwright/test";
import type { ApiResponse } from "./api-client";

// ── Shape Assertions ────────────────────────────────────────────────

/**
 * Assert a list_records response has the expected structure:
 *   { schema: { kind, title, columns, fields, ... }, rows: [...] }
 */
export function assertListRecordsShape(res: ApiResponse, kind: string) {
  expect(res.ok, `list_records(${kind}) should succeed`).toBe(true);
  expect(res.status, `list_records(${kind}) status`).toBe(200);

  const msg = res.message;
  expect(msg, `list_records(${kind}) message is defined`).toBeDefined();
  expect(msg.schema, `list_records(${kind}) has schema`).toBeDefined();
  expect(msg.schema.kind, `list_records(${kind}) schema.kind`).toBe(kind);
  expect(msg.rows, `list_records(${kind}) has rows array`).toBeInstanceOf(Array);
}

/**
 * Assert a get_record response has the expected structure:
 *   { schema: { ... }, row: { id, ... } }
 */
export function assertGetRecordShape(res: ApiResponse, kind: string) {
  expect(res.ok, `get_record(${kind}) should succeed`).toBe(true);
  expect(res.status, `get_record(${kind}) status`).toBe(200);

  const msg = res.message;
  expect(msg, `get_record(${kind}) message is defined`).toBeDefined();
  expect(msg.schema, `get_record(${kind}) has schema`).toBeDefined();
  expect(msg.row, `get_record(${kind}) has row`).toBeDefined();
  expect(msg.row.id, `get_record(${kind}) row has id`).toBeTruthy();
}

/**
 * Assert a save_record response:
 *   { ok: true, name: "..." }
 */
export function assertSaveRecordShape(res: ApiResponse) {
  expect(res.ok, "save_record should succeed").toBe(true);
  expect(res.status, "save_record status").toBe(200);

  const msg = res.message;
  expect(msg, "save_record message is defined").toBeDefined();
  expect(msg.ok, "save_record ok flag").toBe(true);
  expect(msg.name, "save_record returned name").toBeTruthy();
}

/**
 * Assert a delete_record response:
 *   { ok: true }
 */
export function assertDeleteRecordShape(res: ApiResponse) {
  expect(res.ok, "delete_record should succeed").toBe(true);
  expect(res.status, "delete_record status").toBe(200);

  const msg = res.message;
  expect(msg, "delete_record message is defined").toBeDefined();
  expect(msg.ok, "delete_record ok flag").toBe(true);
}

// ── Status Code Assertions ──────────────────────────────────────────

/** Assert an API call returned 200 OK */
export function assertOk(res: ApiResponse, context?: string) {
  const label = context ? `${context}: ` : "";
  expect(res.ok, `${label}response ok`).toBe(true);
  expect(res.status, `${label}status 200`).toBe(200);
}

/** Assert an API call returned 403 Forbidden */
export function assertForbidden(res: ApiResponse, context?: string) {
  const label = context ? `${context}: ` : "";
  expect(res.status, `${label}expected 403`).toBe(403);
}

/** Assert an API call returned 404 Not Found (or Frappe's DoesNotExistError which may be 404 or 417) */
export function assertNotFound(res: ApiResponse, context?: string) {
  const label = context ? `${context}: ` : "";
  expect([404, 417].includes(res.status), `${label}expected 404/417, got ${res.status}`).toBe(true);
}

/** Assert an API call returned 4xx client error */
export function assertClientError(res: ApiResponse, context?: string) {
  const label = context ? `${context}: ` : "";
  expect(res.status, `${label}expected 4xx`).toBeGreaterThanOrEqual(400);
  expect(res.status, `${label}expected 4xx`).toBeLessThan(500);
}

/** Assert an API call returned a validation error (400 or 417) */
export function assertValidationError(res: ApiResponse, context?: string) {
  const label = context ? `${context}: ` : "";
  expect([400, 409, 417].includes(res.status), `${label}expected validation error, got ${res.status}`).toBe(true);
}

// ── Row Content Assertions ──────────────────────────────────────────

/** Assert a list_records response contains a row matching the predicate */
export function assertRowExists(
  res: ApiResponse,
  predicate: (row: Record<string, unknown>) => boolean,
  context?: string,
) {
  const label = context ? `${context}: ` : "";
  const rows = res.message?.rows || [];
  const found = rows.find(predicate);
  expect(found, `${label}expected matching row in ${rows.length} rows`).toBeTruthy();
  return found;
}

/** Assert a list_records response does NOT contain a row matching the predicate */
export function assertRowNotExists(
  res: ApiResponse,
  predicate: (row: Record<string, unknown>) => boolean,
  context?: string,
) {
  const label = context ? `${context}: ` : "";
  const rows = res.message?.rows || [];
  const found = rows.find(predicate);
  expect(found, `${label}expected no matching row`).toBeFalsy();
}

// ── Dispatch / Field Assertions ─────────────────────────────────────

/** Assert a dispatch API response has the expected crew assignment shape */
export function assertCrewAssignment(row: Record<string, unknown>) {
  expect(row.person, "crew assignment has person").toBeTruthy();
  expect(row.status_key, "crew assignment has status_key").toBeTruthy();
}

/** Assert a field job payload has required fields */
export function assertFieldJobPayload(row: Record<string, unknown>) {
  expect(row.job_id, "field job has job_id").toBeTruthy();
  expect(row.stage !== undefined, "field job has stage").toBe(true);
}
