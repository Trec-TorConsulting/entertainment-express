## ADDED Requirements

### Requirement: Marketing Homepage Coverage
The test suite SHALL verify every interactive element on the public marketing homepage.

#### Scenario: Homepage loads without errors
- **WHEN** a Guest navigates to `EE_E2E_PUBLIC`
- **THEN** the page loads with hero section, feature highlights, social proof, and footer without JS errors or missing assets

#### Scenario: Hero CTA button works
- **WHEN** a Guest clicks the primary CTA button in the hero section
- **THEN** the user is navigated to the signup/trial page or a relevant landing page

#### Scenario: Navigation menu links work
- **WHEN** a Guest clicks each link in the main navigation menu (Features, Pricing, Solutions, etc.)
- **THEN** each link navigates to the correct page without 404 or server errors

#### Scenario: Footer links work
- **WHEN** a Guest clicks each footer link (Legal, Privacy, Contact, etc.)
- **THEN** each link navigates to the correct page

### Requirement: Pricing Page Coverage
The test suite SHALL verify the Pricing page with plan comparison.

#### Scenario: Pricing page loads with plan cards
- **WHEN** a Guest navigates to the Pricing page
- **THEN** the page displays plan comparison cards with features, pricing, and CTA buttons

#### Scenario: Annual/monthly toggle
- **WHEN** a Guest clicks the annual/monthly billing toggle (if present)
- **THEN** the displayed prices update to reflect the selected billing period

#### Scenario: Plan CTA buttons work
- **WHEN** a Guest clicks "Start Trial" or "Get Started" on a plan card
- **THEN** the user is navigated to the signup page with the selected plan pre-populated

### Requirement: Solutions Pages Coverage
The test suite SHALL verify all vertical-specific solution pages.

#### Scenario: Solutions page loads
- **WHEN** a Guest navigates to the Solutions page
- **THEN** the page displays solution cards for each vertical (DJs, Inflatables, Photo Booths, etc.)

#### Scenario: Individual solution pages load
- **WHEN** a Guest clicks into each vertical-specific solution page
- **THEN** the page loads with vertical-specific content, features, and CTA without errors

#### Scenario: FAQ accordion interaction
- **WHEN** a Guest clicks on FAQ accordion items on a solution page
- **THEN** the accordion expands to show the answer and collapses when clicked again

### Requirement: Features Pages Coverage
The test suite SHALL verify the Features overview and detail pages.

#### Scenario: Features page loads
- **WHEN** a Guest navigates to the Features page
- **THEN** the page displays a grid/list of platform features with descriptions

#### Scenario: Feature detail pages load
- **WHEN** a Guest clicks on a specific feature card
- **THEN** the feature detail page loads with full description, screenshots, and related features

### Requirement: Signup and Trial Flow Coverage
The test suite SHALL verify the complete signup/trial registration form.

#### Scenario: Signup page loads
- **WHEN** a Guest navigates to the Signup/Start Trial page
- **THEN** the page displays a registration form with Company Name, Full Name, Email, Password, and Plan selection fields

#### Scenario: Signup form validation
- **WHEN** a Guest submits the signup form with empty required fields
- **THEN** validation error messages appear for each missing required field

#### Scenario: Signup form email validation
- **WHEN** a Guest enters an invalid email format and submits
- **THEN** an email validation error message is displayed

#### Scenario: Successful trial signup
- **WHEN** a Guest fills in all required fields with valid data and submits
- **THEN** the form submits successfully and the user is redirected to a confirmation or onboarding page

### Requirement: Tenant Homepage Coverage
The test suite SHALL verify the tenant-specific public homepage (tenant landing page at tenant domain root).

#### Scenario: Tenant homepage loads
- **WHEN** a Guest navigates to a tenant's homepage (`EE_E2E_BASE`)
- **THEN** the page displays tenant-branded content with service cards, testimonials, and booking CTA

#### Scenario: Tenant homepage booking CTA
- **WHEN** a Guest clicks the booking/contact CTA on the tenant homepage
- **THEN** the user is navigated to the request-quote or contact page

### Requirement: Request Quote Form Coverage
The test suite SHALL verify the public quote request form.

#### Scenario: Request quote form loads
- **WHEN** a Guest navigates to the Request Quote page
- **THEN** the page displays a form with Name, Email, Phone, Event Date, Event Type, Venue, and Details fields

#### Scenario: Submitting a quote request
- **WHEN** a Guest fills in all required fields and submits the quote request form
- **THEN** a success confirmation message is displayed

#### Scenario: Quote form validation
- **WHEN** a Guest submits the quote form with missing required fields
- **THEN** validation error messages are displayed for each missing field

### Requirement: Guest Music Requests Coverage
The test suite SHALL verify the public guest music request page.

#### Scenario: Music request page loads
- **WHEN** a Guest navigates to the guest music request page (`/g/<token>`)
- **THEN** the page displays a song request form with Song Name, Artist, and optional Dedication fields

#### Scenario: Submitting a song request
- **WHEN** a Guest fills in Song Name and Artist and submits the music request form
- **THEN** the song request is saved and a confirmation is displayed

### Requirement: Public Schedule Page Coverage
The test suite SHALL verify the public schedule/availability display page.

#### Scenario: Public schedule page loads
- **WHEN** a Guest navigates to the public schedule page
- **THEN** the page displays a calendar or availability view showing bookable dates

### Requirement: Blog Page Coverage
The test suite SHALL verify the blog listing and article pages.

#### Scenario: Blog listing page loads
- **WHEN** a Guest navigates to the Blog page
- **THEN** the page displays a list of blog articles with titles, excerpts, dates, and category tags

#### Scenario: Reading a blog article
- **WHEN** a Guest clicks on a blog article
- **THEN** the full article page loads with content, images, and navigation back to the blog listing

#### Scenario: Filtering blog by category
- **WHEN** a Guest clicks on a category tag/filter
- **THEN** only blog articles matching the selected category are displayed

### Requirement: SEO Meta Tag Verification
The test suite SHALL verify that all public pages include proper SEO meta tags.

#### Scenario: Pages have title and meta description
- **WHEN** the test suite loads each public page
- **THEN** the page has a non-empty `<title>` tag and a `<meta name="description">` tag with content
