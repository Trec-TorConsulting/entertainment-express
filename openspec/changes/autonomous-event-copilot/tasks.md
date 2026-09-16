# Tasks: Autonomous Event Copilot & Agentic Ops

- [ ] 1. DocType & Foundation
  - [ ] 1.1 Create `EE Copilot Action` DocType schema in `entertainment_express/doctype/ee_copilot_action/`
  - [ ] 1.2 Implement mathematical ephemeris solar equations in `entertainment_express/copilot/solar.py`
  - [ ] 1.3 Add unit tests for solar calculations (sunset, golden hour) in `entertainment_express/tests/test_solar.py`

- [ ] 2. Intelligent Run-of-Show Synthesis Engine
  - [ ] 2.1 Implement `entertainment_express/copilot/timeline_synthesizer.py` mapping questionnaire answers and energy curves
  - [ ] 2.2 Wire sunset and curfew constraints into moment scheduling logic
  - [ ] 2.3 Expose whitelisted API `generate_run_of_show` returning structured draft moments

- [ ] 3. Emergency Staffing Replacement Ladder
  - [ ] 3.1 Implement `entertainment_express/copilot/emergency_dispatch.py` scoring replacement talent
  - [ ] 3.2 Wire tokenized 1-click SMS dispatch via Twilio integration with 15-minute expiration timers
  - [ ] 3.3 Implement `claim_emergency_shift` endpoint reassigning the crew role upon successful token verification

- [ ] 4. PDF Rider & Contract Document Parser
  - [ ] 4.1 Implement `entertainment_express/copilot/document_parser.py` extracting PDF text and prompting Ollama schema
  - [ ] 4.2 Map parsed entities into draft `Event Booking` fields and asset checklist rows
  - [ ] 4.3 Add unit tests verifying mock PDF rider extraction

- [ ] 5. Owner Portal UI Integration
  - [ ] 5.1 Implement `CopilotTimelineDrawer.tsx` in `frontend/owner-portal/src/app/routes/bookings/`
  - [ ] 5.2 Implement `RiderUploadModal.tsx` with side-by-side field confirmation
  - [ ] 5.3 Implement emergency dispatch progress indicator in `/owner/dispatch`
  - [ ] 5.4 Verify frontend portal build with `npm run build`
