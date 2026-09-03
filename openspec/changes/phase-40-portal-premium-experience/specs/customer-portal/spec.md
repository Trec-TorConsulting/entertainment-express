## ADDED Requirements

### Requirement: Client Premium Consumer Chrome
The client portal SHALL use **consumer density** with warm spacing, rounded cards, photography-forward event
headers (tenant-provided hero image or gradient fallback), and minimal chrome. Navigation SHALL be bottom tabs
on mobile (Home, Events, Planning, Pay, More) with Pay badge when balance due.

#### Scenario: Pay badge
- **WHEN** the customer has an outstanding balance
- **THEN** the Pay tab shows a numeric badge with the amount string from the API (not client-computed)

### Requirement: Client Home Flagship
`/client` SHALL show: **next-action hero** (sign / pay / plan) with illustration, **event carousel** for
upcoming bookings, **money summary** card (owed / paid / remaining), and **progress rings** for planning
completion per event. Guests SHALL see a simplified hero without money summary.

#### Scenario: Contract waiting
- **WHEN** next action is sign
- **THEN** Home shows a single primary button Review & sign and secondary link to message the company

### Requirement: Event Detail Flagship
`/client/events/:id` (or equivalent) SHALL present a **tabbed event hub**: Overview, Planning, Documents, Pay,
Chat, Photos — with sticky event header (date, venue, status pill). Status pills SHALL map to human labels
(Confirmed, Waiting on you, Complete).

#### Scenario: Planning progress visible
- **WHEN** a customer opens an event with incomplete planning forms
- **THEN** the Planning tab shows a progress bar and checklist of open sections

### Requirement: Pay Flagship Trust
`/client/pay` SHALL present processor logos, SSL/trust copy, line-item breakdown using backend strings, and a
clear total panel. Loading the checkout session SHALL show a branded skeleton; errors SHALL offer retry and
support contact from tenant settings.

#### Scenario: Checkout handoff
- **WHEN** a customer starts deposit payment
- **THEN** they see itemized amounts, then redirect to Stripe/Square with return URL back to a success state
  with confetti animation (respecting reduced motion)

### Requirement: Planning Hub Delight
`/client/planning` SHALL use section cards, autosave indicators, and a **completion celebration** when all
required sections are done (non-blocking toast + progress ring to 100%). Collaborative suggest/vote UI SHALL
use avatars and clear payer vs guest labeling.

#### Scenario: Section autosave
- **WHEN** a customer edits a planning answer
- **THEN** Saved appears within 2 s of successful API write without page reload

## MODIFIED Requirements

### Requirement: Consumer Visual Density
The client portal SHALL use the shared design tokens with comfortable spacing (not ops-compact tables
as the default). Typography SHALL use the consumer scale (larger body, generous line-height). Data tables SHALL
not be the default presentation for bookings — use cards and lists.

#### Scenario: Readable on a phone
- **WHEN** a customer opens an upcoming booking on a 375px viewport
- **THEN** status, date/time, and the primary CTA are visible without horizontal scroll
