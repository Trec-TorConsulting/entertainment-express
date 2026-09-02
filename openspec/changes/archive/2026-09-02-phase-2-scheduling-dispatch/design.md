# Design: Phase 2 — Scheduling & Dispatch

> Prereq: Phase 1 complete. Read `openspec/specs/scheduling-dispatch/spec.md` and
> `openspec/specs/hr-workforce/spec.md` (employee model) before starting.
> Reuse ERPNext Employee; only create new DocTypes for EE-specific concepts.

---

## A. Data model

### New DocTypes

| DocType | Module | Key fields |
|---------|--------|-----------|
| **Crew Assignment** | Scheduling Dispatch | booking (Link: Event Booking), crew_member (Link: Employee), role (Link: EE Crew Role), status (Select: offered\|accepted\|declined\|checked_in\|completed\|no_show), call_time (Datetime), check_in (Datetime), check_out (Datetime), pay_basis (Select: per_event\|hourly), pay_rate (Currency), notes |
| **Run Sheet** | Scheduling Dispatch | booking (Link: Event Booking, unique), generated_at (Datetime), published (Check), venue_address (Small Text), venue_geo (Data), access_notes (Text), client_name (Data), client_phone (Data), emergency_contact (Data), equipment_items (child: Run Sheet Equipment Item), checklist_items (child: Run Sheet Checklist Item), notes (Text Editor) |
| **Run Sheet Equipment Item** | Scheduling Dispatch | asset (Link: Service Asset), asset_name (Data, fetched), quantity (Int), packed (Check) |
| **Run Sheet Checklist Item** | Scheduling Dispatch | description (Data), done (Check), order (Int) |

### ERPNext Employee custom fields (EE extensions — subset; phase-3 adds full HR)

Added via fixtures (`fixtures/custom_field.json` additions, applied on migrate):

| Field | Type | Description |
|-------|------|-------------|
| `ee_employment_type` | Select (w2\|1099\|volunteer) | Worker classification |
| `ee_crew_roles` | Small Text | Comma-separated EE Crew Role names this worker holds |
| `ee_home_base` | Data | Home location / warehouse |
| `ee_service_areas` | Small Text | Comma-separated Service Area names this worker covers |
| `ee_pay_basis` | Select (per_event\|hourly\|salary) | Default pay basis |
| `ee_default_pay_rate` | Currency | Default pay rate for a standard event |

### Event Booking extension (custom field)

| Field | Type | Description |
|-------|------|-------------|
| `ee_dispatch_status` | Select (draft\|dispatched\|in_progress\|completed) | Added to Event Booking |

---

## B. Crew Assignment lifecycle

```
[unassigned booking] → assign/offer → OFFERED
    OFFERED → crew accepts    → ACCEPTED
    OFFERED → crew declines   → DECLINED → reassign
    ACCEPTED → event day      → CHECKED_IN (crew taps mobile)
    CHECKED_IN → event done   → COMPLETED
    ACCEPTED → no-show        → NO_SHOW
```

**Conflict check:** Before creating a Crew Assignment (or marking one ACCEPTED), verify the
crew member has no overlapping Crew Assignment in status `accepted|checked_in` for the same event window.
Use the same buffered-window logic as asset availability.

**Role match:** When assigning, query Employees where `ee_crew_roles` contains the required role name.

---

## C. Run Sheet generation

`api/dispatch.generate_run_sheet(booking_name)`:
1. Pull Event Booking fields (venue, times, client, assets, service items, notes).
2. Pull assigned crew (`Crew Assignment` records).
3. Build default checklist items from the service items' asset type (e.g., "Setup sound system",
   "Test all equipment", "Confirm with client").
4. Build equipment list from `Event Booking Asset` rows.
5. Insert or update `Run Sheet` linked to the booking.
6. On publish, notify assigned crew via `notifications.send("run_sheet_published", ...)`.

---

## D. Dispatch board API

`api/dispatch.get_dispatch_board(date)` returns a list of events for the given date with:
- event details (time, venue, status)
- crew assignments (name, role, status)
- asset assignments
- `at_risk` bool: True if any required crew role from Event Booking Items is unfilled within 48 h of event

Frappe will render this as a JSON API; the front-end desk page (JavaScript) reads it for the board view.

---

## E. At-risk scheduler sweep

`scheduling_dispatch/scheduler.py` → `flag_at_risk_events()`:
- Called hourly via `hooks.py scheduler_events`.
- Finds confirmed bookings within 48 h of `event_date` that have no Crew Assignment in `accepted` status
  for a required crew role.
- Sets a `Frappe Todo` flagging the event for the `EE Dispatcher` role.

---

## F. Notification templates to add

| key | trigger |
|-----|---------|
| `shift_offered` | Crew Assignment created (status = offered) |
| `shift_accepted` | Crew member accepts |
| `shift_declined` | Crew member declines |
| `run_sheet_published` | Run sheet published (sent to all assigned crew) |

---

## G. API surface (`api/dispatch.py`)

All functions `@frappe.whitelist()`, role-checked.

| Function | Description |
|----------|-------------|
| `assign_crew(booking, employee, role)` | Create Crew Assignment (offered) + notify crew |
| `accept_shift(assignment_name, token)` | Mark accepted; check conflicts; notify dispatcher |
| `decline_shift(assignment_name, token)` | Mark declined; notify dispatcher |
| `crew_check_in(assignment_name)` | Mark checked_in; timestamp |
| `crew_check_out(assignment_name)` | Mark completed; timestamp |
| `generate_run_sheet(booking_name)` | Build/update Run Sheet |
| `publish_run_sheet(booking_name)` | Set published=1; notify crew |
| `get_dispatch_board(date)` | Return daily board data |
| `get_run_sheet(booking_name)` | Return run sheet for mobile app |

---

## H. File paths

```
entertainment_express/
└── scheduling_dispatch/
    ├── doctype/
    │   ├── crew_assignment/
    │   │   ├── crew_assignment.json
    │   │   └── crew_assignment.py
    │   ├── run_sheet/
    │   │   ├── run_sheet.json
    │   │   └── run_sheet.py
    │   ├── run_sheet_equipment_item/
    │   │   └── run_sheet_equipment_item.json
    │   └── run_sheet_checklist_item/
    │       └── run_sheet_checklist_item.json
    └── scheduler.py
api/
└── dispatch.py
```

New fixtures appended to `setup/custom_fields.py` CUSTOM_FIELDS dict (Employee + Event Booking fields).
New notification templates appended to `fixtures/notification_templates.json`.
