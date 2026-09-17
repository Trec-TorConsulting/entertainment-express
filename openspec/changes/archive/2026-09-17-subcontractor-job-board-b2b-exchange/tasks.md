## 1. Backend API & Opt-In Settings

- [x] 1.1 Implement `@frappe.whitelist()` `get_b2b_opt_in_status()` and `toggle_b2b_opt_in()` in `entertainment_express/api/subcontractors.py`.
- [x] 1.2 Implement `@frappe.whitelist()` `list_job_board()` and `claim_job_board_listing()` with COI verification in `entertainment_express/api/subcontractors.py`.
- [x] 1.3 Add unit test assertions in `entertainment_express/tests/test_phase12.py`.

## 2. Frontend Job Board & Opt-In UI

- [x] 2.1 Create `frontend/owner-portal/src/app/routes/subcontractors/PostJobModal.tsx` for publishing overflow jobs.
- [x] 2.2 Create `frontend/owner-portal/src/app/routes/subcontractors/B2BOptInCard.tsx` for managing opt-in preferences.
- [x] 2.3 Add "Job Board & B2B Exchange" tab to `SubcontractorsPage.tsx`.

## 3. Verification & Build

- [x] 3.1 Run `npm run build` in `frontend/owner-portal`.
- [x] 3.2 Run `python3 smoke_test.py` to confirm test suite passes.

