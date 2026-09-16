# Tasks: Live Event Flight Deck & Dynamic Timeline Pacing

- [ ] 1. DocType & Schema Foundation
  - [ ] 1.1 Create `EE Live Incident` DocType schema in `entertainment_express/doctype/ee_live_incident/ee_live_incident.json`
  - [ ] 1.2 Extend `Event Booking` with `live_status`, geofence telemetry fields, and `active_timeline_offset_minutes`
  - [ ] 1.3 Extend `Event Timeline Moment` with `live_start_time`, `live_end_time`, `is_live_now`, and `is_completed`
  - [ ] 1.4 Update smoke test validators for new DocType fields

- [ ] 2. Live Ops Backend & Geofence Engine
  - [ ] 2.1 Implement `entertainment_express/live_ops/flight_deck.py` for aggregating active day events and telemetry
  - [ ] 2.2 Implement Haversine distance geofencing in `update_field_milestone` endpoint
  - [ ] 2.3 Implement `entertainment_express/live_ops/incident_desk.py` for logging incidents and sending admin alerts
  - [ ] 2.4 Add unit tests for geofence validation and incident state transitions in `entertainment_express/tests/test_live_ops.py`

- [ ] 3. Dynamic Timeline Pacing Engine
  - [ ] 3.1 Implement `entertainment_express/live_ops/timeline_pacing.py` cascade shifting algorithm
  - [ ] 3.2 Wire Socket.IO broadcasting in `frappe.publish_realtime` on room channels `live_event_{booking}` and `flight_deck_{tenant}`
  - [ ] 3.3 Add unit tests verifying multiple downstream moment adjustments and zero drift for completed moments

- [ ] 4. Owner Portal Flight Deck UI
  - [ ] 4.1 Create `/owner/flight-deck` route and layout in `frontend/owner-portal/src/app/routes/flight-deck/FlightDeckPage.tsx`
  - [ ] 4.2 Implement `LiveOpsMap.tsx` rendering venue pins, vehicle telemetry, and status indicators
  - [ ] 4.3 Implement `ActiveIncidentDrawer.tsx` with 1-click status acknowledgment and resolution actions
  - [ ] 4.4 Add Flight Deck navigation item to Owner Layout

- [ ] 5. Employee & Client Portal Live Execution
  - [ ] 5.1 Implement `LiveMilestoneBar.tsx` in `frontend/employee-portal/src/app/routes/live/` with GPS-assisted check-ins
  - [ ] 5.2 Implement `TimelinePacingController.tsx` with quick `+15m / +30m` delay buttons in `/employee`
  - [ ] 5.3 Implement `LiveIncidentModal.tsx` in `/employee` for on-site fault reporting
  - [ ] 5.4 Update `/client` timeline view to subscribe to live pacing updates and highlight active moments
  - [ ] 5.5 Verify all 3 portals compile cleanly with `npm run build`
