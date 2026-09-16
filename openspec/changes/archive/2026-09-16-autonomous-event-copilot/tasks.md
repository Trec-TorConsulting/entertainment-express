# Tasks: Autonomous Event Copilot & Agentic Ops

- [x] 1. DocType & Foundation
  - [x] 1.1 Create `EE Copilot Action` DocType schema in `entertainment_express/doctype/ee_copilot_action/`
  - [x] 1.2 Implement mathematical ephemeris solar equations in `entertainment_express/copilot/solar.py`
  - [x] 1.3 Add unit tests for solar calculations (sunset, golden hour) in `entertainment_express/tests/test_solar.py`

- [x] 2. Intelligent Run-of-Show Synthesis Engine
  - [x] 2.1 Implement `entertainment_express/copilot/timeline_synthesizer.py` mapping questionnaire answers and energy curves
  - [x] 2.2 Wire sunset and curfew constraints into moment scheduling logic
  - [x] 2.3 Expose whitelisted API `generate_run_of_show` returning structured draft moments

- [x] 3. Emergency Staffing Replacement Ladder
  - [x] 3.1 Implement `entertainment_express/copilot/emergency_dispatch.py` scoring replacement talent
  - [x] 3.2 Wire tokenized 1-click SMS dispatch via Twilio integration with 15-minute expiration timers
  - [x] 3.3 Implement `claim_emergency_shift` endpoint reassigning the crew role upon successful token verification

- [x] 4. PDF Rider & Contract Document Parser
  - [x] 4.1 Implement `entertainment_express/copilot/document_parser.py` extracting PDF text and prompting Ollama schema
  - [x] 4.2 Map parsed entities into draft `Event Booking` fields and asset checklist rows
  - [x] 4.3 Add unit tests verifying mock PDF rider extraction

- [x] 5. Owner Portal UI Integration
  - [x] 5.1 Implement `CopilotTimelineDrawer.tsx` in `frontend/owner-portal/src/app/routes/bookings/`
  - [x] 5.2 Implement `RiderUploadModal.tsx` with side-by-side field confirmation
  - [x] 5.3 Implement emergency dispatch progress indicator in `/owner/dispatch`
  - [x] 5.4 Verify frontend portal build with `npm run build`
