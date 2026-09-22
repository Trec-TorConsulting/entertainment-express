# Design: Backend Quality Verification Architecture

## Validation Pipeline
1. **Python Compilation Suite**: `py_compile.compile()` on every `.py` file under `entertainment_express/`.
2. **DocType Integrity Suite**: Parse every DocType `.json` file, asserting required keys (`name`, `doctype`, `fields` / `istable`).
3. **Availability & Business Engine Suite**: Verify date/time reservation math, asset locks, and worker availability checks.
4. **Stripe Webhook Suite**: Validate idempotency keys and signature validation handlers.
5. **Multi-Tenant Isolation Suite**: Enforce site boundary checks so tenant code never reads another tenant site DB.
6. **Backend Error Log Verification**: Query `Error Log` DocType on target site (`admin.entx.app`) via REST API to ensure 0 fatal backend exceptions.

## Test Harness
- Script: `smoke_test.py`
- Script: `scripts/verify_backend_error_logs.py`
- Bench test execution: `bench --site admin.entx.app run-tests --app entertainment_express`
