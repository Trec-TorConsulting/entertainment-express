/**
 * Input Validation & Injection Tests
 *
 * Verifies that public-facing forms and API endpoints properly
 * sanitize input and reject malicious payloads. Covers XSS,
 * SQL injection attempts, and oversized payloads.
 *
 * IMPORTANT: These tests have retries: 0 — they must never flake.
 */

import { test, expect } from "../support/fixtures";

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "javascript:alert(1)",
  '<iframe src="data:text/html,<script>alert(1)</script>">',
  "{{constructor.constructor('return this')()}}", // template injection
];

const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE tabLead; --",
  "1; SELECT * FROM tabUser --",
  "' UNION SELECT password FROM __Auth --",
];

test.describe("Security — Input Validation", () => {
  // ── XSS in save_record fields ─────────────────────────────────────

  for (const [idx, payload] of XSS_PAYLOADS.entries()) {
    test(`save_record rejects or sanitizes XSS payload #${idx + 1} in inquiry name`, async ({
      apiClient,
    }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_crud.save_record",
        {
          kind: "inquiry",
          values: JSON.stringify({
            contact_name: payload,
            email: "xss-test@test.entx.app",
            status: "New",
          }),
        },
        "owner",
      );

      if (res.ok && res.status === 200) {
        // Record was saved — verify the stored value is sanitized
        const name = res.message?.name;
        if (name) {
          const getRes = await apiClient.callApi(
            "entertainment_express.api.portal_crud.get_record",
            { kind: "inquiry", name },
            "owner",
          );

          if (getRes.ok) {
            const stored = getRes.message?.row?.contact_name || "";
            // The stored value must NOT contain executable script tags
            expect(stored, `XSS payload was stored unsanitized: ${stored}`).not.toContain("<script");
            expect(stored).not.toContain("onerror=");
            expect(stored).not.toContain("onload=");
          }

          // Cleanup
          await apiClient.callApi(
            "entertainment_express.api.portal_crud.delete_record",
            { kind: "inquiry", name },
            "owner",
          );
        }
      }
      // If the API rejected the payload (non-200), that's also acceptable
    });
  }

  // ── SQL injection in list_records filter ───────────────────────────

  for (const [idx, payload] of SQLI_PAYLOADS.entries()) {
    test(`list_records handles SQLi payload #${idx + 1} safely`, async ({ apiClient }) => {
      const res = await apiClient.callApi(
        "entertainment_express.api.portal_crud.list_records",
        { kind: "package", filter: payload },
        "owner",
      );

      // The server should either return safely (no SQL error) or reject
      // It must NOT return a 500 Internal Server Error from SQL injection
      expect(res.status, `SQLi payload caused server error: ${payload}`).not.toBe(500);
    });
  }

  // ── Oversized payload ─────────────────────────────────────────────

  test("save_record rejects extremely long field values", async ({ apiClient }) => {
    const longString = "A".repeat(100_000); // 100KB field value
    const res = await apiClient.callApi(
      "entertainment_express.api.portal_crud.save_record",
      {
        kind: "inquiry",
        values: JSON.stringify({
          contact_name: "QA Oversize Test",
          email: "oversize@test.entx.app",
          notes: longString,
          status: "New",
        }),
      },
      "owner",
    );

    // Either rejected (4xx) or accepted but truncated — must NOT 500
    expect(res.status, "oversized payload caused server crash").not.toBe(500);

    // Cleanup if saved
    if (res.ok && res.message?.name) {
      await apiClient.callApi(
        "entertainment_express.api.portal_crud.delete_record",
        { kind: "inquiry", name: res.message.name },
        "owner",
      );
    }
  });

  // ── Invalid kind parameter ────────────────────────────────────────

  test("list_records with invalid kind returns error, not stack trace", async ({ apiClient }) => {
    const res = await apiClient.callApi(
      "entertainment_express.api.portal_crud.list_records",
      { kind: "../../../../etc/passwd" },
      "owner",
    );

    // Must NOT 500 — should be 4xx or handled gracefully
    expect([400, 403, 417].includes(res.status) || (res.ok && res.status === 200),
      `Path traversal in kind caused unexpected ${res.status}`,
    ).toBe(true);

    // If it returned 200, verify no system information was leaked
    if (res.ok) {
      const body = JSON.stringify(res.raw);
      expect(body).not.toContain("root:");
      expect(body).not.toContain("/bin/");
    }
  });

  // ── CSRF protection on mutations ──────────────────────────────────

  test("mutation without CSRF token is handled safely", async ({ apiClient }) => {
    // The API client doesn't send X-Frappe-CSRF-Token — Frappe's
    // API method calls via POST with JSON may not require CSRF if
    // using session auth. This test documents the current behavior.
    const res = await apiClient.callApi(
      "entertainment_express.api.portal_crud.save_record",
      {
        kind: "inquiry",
        values: JSON.stringify({
          contact_name: "QA CSRF Test",
          email: "csrf@test.entx.app",
          status: "New",
        }),
      },
      "owner",
    );

    // Document whether CSRF is enforced (both outcomes are tested)
    if (res.status === 403 || res.status === 401) {
      // CSRF is enforced — good security practice
      console.log("✓ CSRF token is enforced on mutations");
    } else if (res.ok) {
      console.warn("⚠ Mutation succeeded without explicit CSRF token (Frappe session auth)");
      // Cleanup
      if (res.message?.name) {
        await apiClient.callApi(
          "entertainment_express.api.portal_crud.delete_record",
          { kind: "inquiry", name: res.message.name },
          "owner",
        );
      }
    }
  });
});
