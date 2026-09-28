import frappe
from frappe.utils import slug

SEED_CATEGORIES = [
    {
        "category_name": "Getting Started & Setup",
        "route": "getting-started",
        "description": "Essential guides for onboarding your entertainment business, company profiles, custom domains, and payments.",
        "icon": "rocket"
    },
    {
        "category_name": "Owner Operations & Business Cockpit",
        "route": "owner-operations",
        "description": "Manage your service catalog, packages, equipment inventory, sales pipeline, job costing, and dispatch.",
        "icon": "briefcase"
    },
    {
        "category_name": "Client & Event Host Portal",
        "route": "client-experience",
        "description": "How clients view interactive proposals, e-sign contracts, pay deposits, fill questionnaires, and plan music.",
        "icon": "heart"
    },
    {
        "category_name": "Field Crew & Mobile Playbook",
        "route": "field-crew",
        "description": "Step-by-step guides for DJs, drivers, technicians, and attendants using the mobile phone PWA in the field.",
        "icon": "smartphone"
    },
    {
        "category_name": "APIs, Hardware & Webhooks",
        "route": "api-integrations",
        "description": "Technical reference for REST APIs, webhook events, Google/Outlook calendar sync, and DJ software playlist exports.",
        "icon": "code"
    }
]

SEED_ARTICLES = [
    # =========================================================================
    # 1. GETTING STARTED & SETUP
    # =========================================================================
    {
        "title": "Welcome to Entertainment Express: Platform Tour & Concepts",
        "category": "Getting Started & Setup",
        "route": "welcome-platform-overview",
        "role": "All Users",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "Understand how the three portals (Owner, Field Crew, and Client) work together to power your entertainment company.",
        "content": """
<h2>Welcome to Entertainment Express</h2>
<p>Entertainment Express is the all-in-one operations system created specifically for companies that bring entertainment and party fun to event venues — mobile DJs, inflatable and party rentals, photo booths, game trucks, casino parties, and talent performers.</p>

<div class="callout-box">
  <strong>Key Philosophy:</strong> Your company runs on three dedicated, tailored interfaces so nobody gets overwhelmed with features they don't need:
</div>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>The Owner Cockpit (<code>/owner</code>)</h3>
      <p>This is where company owners, sales staff, and dispatch managers run the business. You can view leads, send quotes, dispatch crew, track equipment inventory, inspect profit margins, and manage payroll.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>The Mobile Field App (<code>/employee</code>)</h3>
      <p>This is the phone-first app for your field crew, DJs, attendants, and drivers. It works offline in cellular dead-zones, displays run sheets, scans barcodes during truck load-in, and lets workers report damage with on-site photos.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>The Client Event Portal (<code>/client</code>)</h3>
      <p>Your customers (brides, party hosts, corporate planners) use this portal to pick package add-ons, sign digital contracts, pay deposits, fill out timeline schedules, and submit must-play songs.</p>
    </div>
  </div>
</div>

<div class="tip-box">
  <strong>Pro-Tip for New Owners:</strong> You never have to give your clients or gig workers messy back-office logins. Everything is white-labeled with your logo and brand colors so your business looks polished and professional from day one.
</div>
"""
    },
    {
        "title": "Company Profile, Headquarters & Service Area Setup",
        "category": "Getting Started & Setup",
        "route": "company-profile-setup",
        "role": "Owner",
        "level": "Beginner",
        "read_time": "5 min read",
        "summary": "Step-by-step instructions to configure your business address, dispatch headquarters, travel radius, and sales tax rules.",
        "content": """
<h2>Setting Up Your Company Profile</h2>
<p>Before sending quotes or dispatching vans, take 5 minutes to set up your company details so contracts and invoices show your correct address and tax rates.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Go to Company Settings</h3>
      <p>Log in as an owner and navigate to <strong>Settings</strong> in the main navigation (or visit <code>/owner/settings</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Enter Your Legal Business Information</h3>
      <p>Fill in your legal business name, contact phone number, support email address, and physical warehouse address. This information automatically populates on your client contracts and payment receipts.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Configure Service Area & Mileage Radius</h3>
      <p>Set your primary dispatch location (your warehouse or home base) and define your free travel radius (e.g., 25 miles). Any booking outside this radius will automatically calculate round-trip mileage surcharges on client quotes.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Set Sales Tax & Equipment Damage Waiver</h3>
      <p>If your state or county charges sales tax on rental gear or services, enter your local percentage rate. You can also turn on an optional Damage Waiver fee (typically 8–10%) that protects clients against accidental wear-and-tear.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "White-Label Branding: Custom Logo, Colors & Notifications",
        "category": "Getting Started & Setup",
        "route": "white-label-branding-guide",
        "role": "Owner",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to make the platform completely yours with your company logos, primary brand color, and personalized email signatures.",
        "content": """
<h2>Making Entertainment Express Your Brand</h2>
<p>Your clients and staff should always see your brand identity, not ours. You can customize the look and feel in seconds.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Brand Kit</h3>
      <p>Click on <strong>Brand</strong> in the Owner sidebar or go directly to <code>/owner/brand</code>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Upload Your Logos & Favicon</h3>
      <p>Upload a primary logo (recommended size: 500x120px with transparent background) and a square icon for mobile browser bookmarks (favicon). You can upload separate versions for light mode and dark mode.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Choose Your Brand Accent Color</h3>
      <p>Use the color picker or enter your hex code (e.g., <code>#3B82F6</code> for royal blue or <code>#F59E0B</code> for amber gold). This color is applied automatically to proposal buttons, portal highlights, and invoice headers.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Personalize Email & SMS Footers</h3>
      <p>Add your company slogan, office hours, and Instagram/Facebook links to the bottom of all automated booking confirmations and balance reminders.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Connecting Your Custom Domain (e.g., portal.yourcompany.com)",
        "category": "Getting Started & Setup",
        "route": "custom-domains-white-label",
        "role": "Owner",
        "level": "Intermediate",
        "read_time": "5 min read",
        "summary": "How to point your own web domain to your client portal with automated SSL certificates so clients never see a third-party URL.",
        "content": """
<h2>Using Your Own Domain Name</h2>
<p>Rather than directing clients to a generic URL, you can run your booking site, proposals, and customer portal directly under your own website domain (like <code>book.acmedjs.com</code> or <code>portal.floridabounce.com</code>).</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Log In to Your Domain Registrar</h3>
      <p>Sign in to where you purchased your website domain (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.) and open your <strong>DNS Management</strong> page.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Add a CNAME Record</h3>
      <p>Create a new record with the following settings:</p>
      <ul>
        <li><strong>Type:</strong> <code>CNAME</code></li>
        <li><strong>Host / Name:</strong> <code>book</code> or <code>portal</code> (or whatever subdomain you prefer)</li>
        <li><strong>Points to / Value:</strong> <code>entx.app</code></li>
        <li><strong>TTL:</strong> Automatic or 1 Hour</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Enter the Domain in Entertainment Express</h3>
      <p>Go to <code>/owner/brand</code>, find the <strong>Custom Domain</strong> section, type your full subdomain (e.g., <code>portal.yourcompany.com</code>), and click <strong>Verify Domain</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Automated SSL Certificate</h3>
      <p>Our cluster will automatically provision a secure LetsEncrypt SSL padlock certificate. Within 5–10 minutes, all client links, proposals, and portals will serve over HTTPS under your branded domain.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Connecting Stripe & Square to Collect Customer Payments",
        "category": "Getting Started & Setup",
        "route": "payment-gateway-setup",
        "role": "Owner",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "Link your Stripe or Square account so clients can pay deposits with credit cards, Apple Pay, Google Pay, or bank transfers.",
        "content": """
<h2>Setting Up Customer Online Payments</h2>
<p>Entertainment Express connects directly to Stripe and Square so money flows immediately into your company bank account with zero middleman hold times.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Payment Settings</h3>
      <p>In the Owner Portal, click <strong>Money</strong> in the navigation and select <strong>Payment Gateways</strong> (or visit <code>/owner/money</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Connect Stripe (Recommended)</h3>
      <p>Click <strong>Connect with Stripe</strong>. You will be redirected to Stripe to sign in or create an account. Once connected, your clients can pay using Credit Cards, Apple Pay, Google Pay, and ACH Bank Transfers.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Set Your Deposit & Retainer Policy</h3>
      <p>Choose your standard deposit requirement:</p>
      <ul>
        <li><strong>Percentage Deposit:</strong> E.g., 25% or 50% required to lock in the reservation.</li>
        <li><strong>Flat Dollar Deposit:</strong> E.g., $100 flat retainer.</li>
        <li><strong>Balance Due Date:</strong> Specify when the remaining balance must be paid (e.g., 14 days before the event date or on event day).</li>
      </ul>
    </div>
  </div>
</div>
"""
    },

    # =========================================================================
    # 2. OWNER OPERATIONS & BUSINESS COCKPIT
    # =========================================================================
    {
        "title": "Setting Up Service Packages & Add-On Upsells",
        "category": "Owner Operations & Business Cockpit",
        "route": "service-catalog-inventory",
        "role": "Owner",
        "level": "Beginner",
        "read_time": "6 min read",
        "summary": "How to create your sellable packages (DJ packages, bounce houses, 360 booths, game truck hours) and high-margin add-ons.",
        "content": """
<h2>Building Your Service Catalog</h2>
<p>Your Service Catalog defines <em>what you sell</em>. Clear packages with attractive add-ons make it effortless for customers to choose higher-tier options.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Navigate to Catalog</h3>
      <p>Click on <strong>Catalog</strong> in the Owner sidebar (<code>/owner/catalog</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Create a Primary Service Package</h3>
      <p>Click <strong>Add Package</strong>. For example:</p>
      <ul>
        <li><strong>Package Name:</strong> <em>Gold Wedding DJ Experience</em> or <em>Tropical Water Slide All-Day Rental</em></li>
        <li><strong>Base Duration:</strong> E.g., 4 Hours or All Day</li>
        <li><strong>Base Price:</strong> E.g., $1,495.00</li>
        <li><strong>Client Description:</strong> List 4–5 bullet points of what's included (sound system, wireless mics, dance lighting, setup & teardown).</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Create Add-On Upsells</h3>
      <p>Add-ons are optional upgrades clients can toggle on proposals:</p>
      <ul>
        <li>Extra Hour Overtime ($150/hr)</li>
        <li>Wireless Uplighting Kit ($250)</li>
        <li>Cold Spark Fountain Machine ($350)</li>
        <li>Custom Photobooth Backdrop & Physical Album ($175)</li>
        <li>Commercial Generator Fuel Included ($120)</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Link to Equipment Inventory (Optional but Recommended)</h3>
      <p>Under the <em>Production Assets</em> tab, check the physical equipment units needed for this package. This allows the system to automatically block out that equipment on the calendar so you never double-book.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Equipment Asset Management & Double-Booking Prevention",
        "category": "Owner Operations & Business Cockpit",
        "route": "equipment-inventory-management",
        "role": "Owner",
        "level": "Intermediate",
        "read_time": "6 min read",
        "summary": "How to register serialized gear, assign barcode labels, and configure turnaround buffer times so gear is never double-scheduled.",
        "content": """
<h2>Equipment Fleet & Inventory Control</h2>
<p>In mobile entertainment, double-booking equipment or forgetting a critical cable ruins events. Entertainment Express separates what you sell from what you own so your inventory stays strictly accurate.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Go to Fleet & Assets</h3>
      <p>Click <strong>Fleet</strong> in the Owner sidebar (<code>/owner/fleet</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Add Your Physical Units</h3>
      <p>For each piece of bookable gear (e.g., <em>360 Booth Unit #1</em>, <em>Dual Water Slide Unit #2</em>, <em>QSC Speaker Pair #3</em>):</p>
      <ul>
        <li>Enter the Serial Number or Asset Tag</li>
        <li>Generate or enter a Barcode / QR Code (used by crew during load-out)</li>
        <li>Set the Warehouse Location (e.g., Bay A, Rack 3, or Van #2)</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Set Turnaround & Buffer Times</h3>
      <p>Equipment cannot be in two places at once. Set realistic buffer hours:</p>
      <ul>
        <li><strong>Setup Buffer:</strong> E.g., 1.5 hours before event start for setup and sound checks.</li>
        <li><strong>Teardown & Cleaning Buffer:</strong> E.g., 2 hours after event end for roll-up, drying, sanitization, and transit.</li>
      </ul>
      <p>The system will automatically prevent any other quote from claiming that asset during its total reservation window.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Build Production BOMs (Van Kits)</h3>
      <p>Group accessories into a Bill of Materials (BOM). For example, a "Sound Rig Kit" bundles 2 main speakers, 2 speaker stands, 2 XLR cables, power strip, and wireless mic. When you book the rig, the entire bundle is reserved.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Managing the Sales Pipeline: Inquiries to Confirmed Bookings",
        "category": "Owner Operations & Business Cockpit",
        "route": "sales-pipeline-proposals",
        "role": "Owner",
        "level": "Beginner",
        "read_time": "5 min read",
        "summary": "How leads enter your system, how to check live availability, and how to send interactive proposals that clients sign and pay.",
        "content": """
<h2>The Core Sales Pipeline</h2>
<p>Turn website inquiries into paid, contracted bookings in 4 simple steps without manual paperwork.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>New Inquiries in Pipeline</h3>
      <p>When someone fills out your website contact or quote form, they appear instantly at <code>/owner/pipeline</code> under the <strong>Inquiries</strong> column with date, venue location, and package preference.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>One-Click Availability Check</h3>
      <p>Open the inquiry card. A green indicator shows whether your equipment assets and crew are available for that exact date and time window. If an asset is already booked, the system suggests alternative available packages.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Generate & Send Interactive Proposal</h3>
      <p>Click <strong>Create Proposal</strong>. Choose which packages and add-ons to offer the client. Click <strong>Send to Client</strong>. The client receives a branded SMS and email containing a private link to their interactive proposal.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Automatic Confirmation on Payment</h3>
      <p>When the client selects their options, signs the contract, and pays the deposit in their portal, the booking automatically moves to <strong>Confirmed Bookings</strong>, creates calendar entries, and notifies your dispatch team.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Crew Scheduling & Dispatch: Assigning Talent, Vans & Run Sheets",
        "category": "Owner Operations & Business Cockpit",
        "route": "dispatch-scheduling-crews",
        "role": "Owner",
        "level": "Intermediate",
        "read_time": "6 min read",
        "summary": "How to schedule DJs, attendants, and drivers, assign transport vehicles, set arrival times, and publish digital run sheets.",
        "content": """
<h2>Dispatch Board & Crew Assignment</h2>
<p>Make sure the right people and equipment arrive at the right venue with hours to spare.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Dispatch Board</h3>
      <p>Go to <code>/owner/dispatch</code>. You will see all confirmed events for the upcoming weekend arranged by date and time.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Assign Workers & Talent</h3>
      <p>Click <strong>Assign Crew</strong> on any event card. Select your lead entertainer, driver, or attendant. The system highlights staff who have matching skill tags and warns you if someone is already booked or requested time off.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Assign Transport Vehicle</h3>
      <p>Select which van, truck, or trailer will carry the gear. The system checks payload weight capacity against your total equipment load to prevent overloaded trucks.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Set Call Times & Publish Run Sheet</h3>
      <p>Enter the <strong>Call Time</strong> (when crew must arrive at the shop) and <strong>Venue Arrival Time</strong>. When you click <strong>Publish Dispatch</strong>, the job packet instantly syncs to the crew member's mobile app at <code>/employee</code>.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Money, Job Costing, Margin Defense & Real Event Profitability",
        "category": "Owner Operations & Business Cockpit",
        "route": "job-costing-margin-defense",
        "role": "Owner",
        "level": "Advanced",
        "read_time": "5 min read",
        "summary": "Track real profit margins for every gig by calculating direct labor, transit fuel, wear amortization, and merchant fees.",
        "content": """
<h2>Event Profitability & Job Costing</h2>
<p>Just because an event brought in $2,000 does not mean it was profitable. Entertainment Express calculates your true Cost of Goods Sold (COGS) so you always know your exact take-home profit.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>View the Money & Margin Cockpit</h3>
      <p>Navigate to <code>/owner/money</code>. Each booking displays a live gross margin percentage badge (e.g., 68% Margin).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Understand Direct Cost Factors</h3>
      <p>The system automatically rolls up all direct expenses associated with the event:</p>
      <ul>
        <li><strong>Crew Labor:</strong> Hourly wages or flat gig pay for all dispatched workers.</li>
        <li><strong>Vehicle Transit:</strong> Calculated mileage costs from your warehouse to the venue.</li>
        <li><strong>Equipment Wear & Tear:</strong> Small percentage amortization per operating hour.</li>
        <li><strong>Payment Processing:</strong> Actual Stripe/Square credit card processing fees deducted from net revenue.</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Margin Floor Guardrails</h3>
      <p>If a sales representative offers an excessive discount that drops the event margin below your company threshold (e.g., 35%), the system locks the quote and requires Owner approval before it can be sent to the client.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Gig Payroll, Commissions & Automated Digital Tip Splitting",
        "category": "Owner Operations & Business Cockpit",
        "route": "gig-payroll-commissions-tips",
        "role": "Owner",
        "level": "Intermediate",
        "read_time": "5 min read",
        "summary": "How to set up gig worker rate cards, calculate sales commissions, and divide digital client tips evenly or by hours worked.",
        "content": """
<h2>Worker Compensation & Tip Distribution</h2>
<p>Managing pay for W2 employees and 1099 gig contractors can be tedious. Entertainment Express automates rate calculations and tip distribution.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Configure Worker Rate Cards</h3>
      <p>Under <code>/owner/settings</code> &gt; <strong>Worker Rates</strong>, assign pay rates for each team member:</p>
      <ul>
        <li>Flat Gig Rate (e.g., $300 per wedding or $150 per 3-hour booth)</li>
        <li>Hourly Rate with Overtime (e.g., $22/hr, 1.5x after 8 hours)</li>
        <li>Lead Worker / Driver Bonus ($50 per event)</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Automated Tip Pool Splitting</h3>
      <p>When clients leave a credit card tip through their portal or mobile checkout, the tip pool algorithm distributes funds based on your company rule:</p>
      <ul>
        <li><strong>Equal Split:</strong> Split evenly among all crew members who worked the gig.</li>
        <li><strong>Hours-Weighted:</strong> Split proportionally based on clock-in hours.</li>
        <li><strong>Role-Weighted:</strong> 60% to Lead Entertainer, 40% to Assistant/Attendant.</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>One-Click Payroll Summary</h3>
      <p>At the end of the pay period, export your compiled payroll batch with gross pay, tips, and reimbursements ready for QuickBooks, Gusto, ADP, or direct ACH transfer.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Outdoor Events & Weather Risk Safety Policies",
        "category": "Owner Operations & Business Cockpit",
        "route": "weather-outdoor-risk-management",
        "role": "Owner",
        "level": "Intermediate",
        "read_time": "5 min read",
        "summary": "Set wind and lightning safety limits for outdoor rentals, monitor live forecasts, and issue rain-date vouchers with 1 click.",
        "content": """
<h2>Weather Risk & Safety Management</h2>
<p>For outdoor party rentals, bounce houses, and open-air DJ setups, high winds and thunderstorms present serious liability and safety risks.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Set Company Safety Thresholds</h3>
      <p>In <strong>Settings</strong> &gt; <strong>Weather Policy</strong>, configure your safety limits:</p>
      <ul>
        <li><strong>Max Wind Speed:</strong> Standard safety regulation is 15–20 mph max for inflatable rides.</li>
        <li><strong>Precipitation Limit:</strong> Rain probability thresholds (e.g., 60%+ chance triggers alerts).</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Automated 48-Hour Forecast Monitoring</h3>
      <p>The system monitors weather conditions for each booking location. 48 hours prior to an outdoor event, any risky weather is highlighted with an amber or red weather warning on your <strong>Today</strong> dashboard.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>1-Click Rain-Date Rescheduling</h3>
      <p>If severe weather prevents setup, click <strong>Issue Rain Date Voucher</strong> on the booking. The client is notified immediately and given a self-service link to pick a new available weekend without losing their deposit.</p>
    </div>
  </div>
</div>
"""
    },

    # =========================================================================
    # 3. CLIENT & EVENT HOST PORTAL
    # =========================================================================
    {
        "title": "Welcome to Your Event Portal: Quick Start Guide",
        "category": "Client & Event Host Portal",
        "route": "client-portal-proposals-planning",
        "role": "Client",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to log into your event portal without passwords, track your planning checklist, and manage your party in one place.",
        "content": """
<h2>Welcome to Your Client Portal</h2>
<p>Congratulations on your upcoming celebration! Your entertainment company has set up a private, secure portal where you can customize your package, sign contracts, pay deposits, and choose your favorite music.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Instant Passwordless Login</h3>
      <p>You never have to remember a password. Simply tap the private link sent to your email or text message, or enter your email at the login page to receive a 1-tap secure login link.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Your Event Countdown & Checklist</h3>
      <p>On your home screen (<code>/client</code>), you will see an event countdown and a helpful progress checklist:</p>
      <ul>
        <li>✅ Proposal Accepted</li>
        <li>✅ Contract E-Signed</li>
        <li>✅ Deposit Paid</li>
        <li>⏳ Event Planning Questionnaire (Timeline & Details)</li>
        <li>⏳ Music & Song Requests</li>
        <li>⏳ Final Balance Payment</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Save to Your Phone</h3>
      <p>On your smartphone browser, tap the Share icon and select <strong>Add to Home Screen</strong> so you can access your party details anytime with one tap.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Reviewing & Customizing Your Event Proposal",
        "category": "Client & Event Host Portal",
        "route": "client-reviewing-proposals",
        "role": "Client",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to compare package options, toggle fun add-on upgrades, and see exact real-time pricing before booking.",
        "content": """
<h2>Customizing Your Event Proposal</h2>
<p>Unlike old-fashioned paper quotes, your proposal is completely interactive. You can explore different options and customize the exact experience you want.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Your Proposal</h3>
      <p>In your portal, click on <strong>Proposals</strong> (or visit <code>/client/proposals</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Compare Packages</h3>
      <p>You may see several tier options (e.g., <em>Standard</em> vs. <em>Premium Experience</em>). Click on each package to see what is included in the price.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Select Fun Add-On Upgrades</h3>
      <p>Check the boxes next to any optional upgrades you'd like to add — such as extra hours of service, dance floor uplighting, customized photo booth print strips, or bubble machines. Your total price and deposit will update instantly on your screen.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Lock In Your Selection</h3>
      <p>When you are happy with your choices, click <strong>Accept & Continue to Contract</strong>.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "E-Signing Your Event Contract in 60 Seconds",
        "category": "Client & Event Host Portal",
        "route": "client-signing-contracts",
        "role": "Client",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "How to review your event date, times, location, and digitally sign your agreement securely on any phone or computer.",
        "content": """
<h2>Signing Your Digital Contract</h2>
<p>Signing your contract is quick, secure, and legally binding under federal E-SIGN laws.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Review Contract Details</h3>
      <p>Under <code>/client/documents</code>, review your event date, setup times, venue address, and package inclusions to make sure everything matches your expectations.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Sign With Your Finger or Mouse</h3>
      <p>Scroll to the bottom of the agreement. Type your full legal name or use your finger/stylus on your phone screen to draw your signature in the signature box.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Submit & Download</h3>
      <p>Click <strong>Sign & Accept</strong>. A timestamped PDF copy is immediately available for download and emailed to you for your records.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Paying Your Deposit & Managing Payment Schedules",
        "category": "Client & Event Host Portal",
        "route": "client-paying-deposits",
        "role": "Client",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to pay your booking deposit with credit card or Apple Pay, view balance due dates, and download payment receipts.",
        "content": """
<h2>Paying Deposits & Event Balances</h2>
<p>Making payments is safe, encrypted, and processed directly through industry-standard banks.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open the Pay Section</h3>
      <p>Click <strong>Pay</strong> in your client portal menu (<code>/client/pay</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Select Payment Method</h3>
      <p>You can pay using:</p>
      <ul>
        <li>Any major Credit or Debit Card (Visa, MasterCard, Amex, Discover)</li>
        <li>Apple Pay or Google Pay (1-tap checkout on mobile)</li>
        <li>Bank ACH Transfer (for corporate or larger balance payments)</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Payment Schedule & Auto-Pay</h3>
      <p>You will see your exact payment schedule, including when the remaining balance is due. You can make payments anytime or enable Auto-Pay so the balance is automatically handled on the due date.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Completing Your Event Planning Questionnaire & Timeline",
        "category": "Client & Event Host Portal",
        "route": "client-planning-questionnaires",
        "role": "Client",
        "level": "Beginner",
        "read_time": "5 min read",
        "summary": "Tell your entertainment team all the important details: schedule timeline, announcements, venue gate codes, and VIP contacts.",
        "content": """
<h2>Planning Your Event Details & Timeline</h2>
<p>To ensure your event runs smoothly, your entertainment team needs a few logistical details. Your planning form is tailored specifically to your event type.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Planning</h3>
      <p>Go to <strong>Planning</strong> in your portal (<code>/client/planning</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Answer Event-Specific Questions</h3>
      <p>Fill in key details:</p>
      <ul>
        <li><strong>Venue Logistics:</strong> Loading dock info, stairs vs elevator, outdoor power outlet availability, gate codes.</li>
        <li><strong>Schedule & Timeline:</strong> Guest arrival, grand entrance time, dinner service, speeches, cake cutting, party end time.</li>
        <li><strong>Announcements:</strong> Correct pronunciations of VIP names (wedding party, guest of honor, keynote speakers).</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Save As You Go</h3>
      <p>You don't have to finish everything in one sitting. Click <strong>Save Progress</strong> anytime. You can return and update answers until your final confirmation cutoff date.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Building Your Music Playlist: Must-Plays & Do-Not-Plays",
        "category": "Client & Event Host Portal",
        "route": "client-music-playlist-planning",
        "role": "Client",
        "level": "Beginner",
        "read_time": "5 min read",
        "summary": "Curate the soundtrack for your party: choose your Must-Play songs, Do-Not-Play tracks, and special ceremony moments.",
        "content": """
<h2>Planning Your Music & Song Choices</h2>
<p>Music sets the entire mood of your celebration. Our interactive music planner lets you communicate your musical taste directly to your DJ.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Go to Music Planning</h3>
      <p>Click <strong>Music</strong> in your portal (or navigate to <code>/client/event</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Add Songs to Categories</h3>
      <p>Search by Song Title or Artist name and add them to:</p>
      <ul>
        <li><strong>Must Play:</strong> Songs your DJ is guaranteed to play during peak dance hours.</li>
        <li><strong>Play If Possible:</strong> Great suggestions that fit the vibe if time allows.</li>
        <li><strong>Do Not Play:</strong> Songs or genres that are strictly banned from your event (no exceptions!).</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Assign Special Moment Tracks</h3>
      <p>If you are planning a wedding or milestone party, select the specific songs for key moments: First Dance, Father-Daughter, Mother-Son, Cake Cutting, and Send-Off Song.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Import Spotify Playlists</h3>
      <p>Already have a playlist on Spotify? Simply paste your Spotify playlist link and our system will import the track titles automatically.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Inviting Guests to Request Songs ('Ask The DJ' QR Code)",
        "category": "Client & Event Host Portal",
        "route": "client-guest-music-requests-qr",
        "role": "Client",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to generate and share a custom QR code so wedding and party guests can submit song requests from their phones.",
        "content": """
<h2>'Ask The DJ' Guest Song Requests</h2>
<p>Want your guests to feel involved before and during the party? Share your private guest request link!</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Get Your Guest Link & QR Code</h3>
      <p>In your Music section, click <strong>Guest Request Code</strong>. You will receive a unique link and printable QR code graphic.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Share with Family & Friends</h3>
      <p>You can text the link to guests, put the QR code on your event invitations, or display printed tent cards on cocktail tables during the reception.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>How Guests Request Songs</h3>
      <p>Guests scan the QR code with their phone camera. No app download or login is required. They can search for songs and tap to request them.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>You Stay in Full Control</h3>
      <p>Your DJ reviews incoming guest requests live against your "Do-Not-Play" list to make sure inappropriate or banned songs are never played.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Accessing Photo Booth Galleries & Deliverables After Your Event",
        "category": "Client & Event Host Portal",
        "route": "client-accessing-photo-deliverables",
        "role": "Client",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "How to view and download your full-resolution photo booth pictures, GIFs, and video reels after the celebration.",
        "content": """
<h2>Your Post-Event Photos & Deliverables</h2>
<p>If you booked a photo booth, 360 video booth, or photography package, your digital deliverables will be uploaded directly to your portal.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Receive Your Gallery Notification</h3>
      <p>Within 24–48 hours after your event, you will receive an email and text notification that your gallery is published.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Browse Photos & GIFs</h3>
      <p>Click on <strong>Photos</strong> in your portal (<code>/client/photos</code>). You will find all single captures, photo strips, boomerang GIFs, and 360 video clips organized by event.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Download or Share</h3>
      <p>Click <strong>Download All (ZIP)</strong> to save every high-resolution file to your computer or phone. You can also share a view-only link with your guests so they can download their favorite pictures.</p>
    </div>
  </div>
</div>
"""
    },

    # =========================================================================
    # 4. FIELD CREW & MOBILE PLAYBOOK
    # =========================================================================
    {
        "title": "Installing the Crew Mobile App (PWA) on iPhone & Android",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-installing-mobile-field-app",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "How to add the lightweight field app to your phone home screen with 1 tap, and how offline sync works when you lose signal.",
        "content": """
<h2>Installing the Field Crew App on Your Phone</h2>
<p>The crew app is built as a progressive mobile web app (PWA). It does not require downloading a heavy file from the App Store and works completely offline.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Your Invite Link on Your Phone</h3>
      <p>Open Safari on your iPhone, or Google Chrome on your Android device, and visit your company's employee URL (typically <code>portal.yourcompany.com/employee</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Add to Your Phone's Home Screen</h3>
      <ul>
        <li><strong>On iPhone:</strong> Tap the <em>Share</em> button at the bottom of Safari, scroll down, and tap <strong>Add to Home Screen</strong>.</li>
        <li><strong>On Android:</strong> Tap the three dots menu at the top right of Chrome, and select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
      </ul>
      <p>An app icon will now appear on your home screen just like any native app.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Offline Mode Guarantee</h3>
      <p>Once opened, your today's schedule, run sheets, and client notes are stored locally on your device. Even if you arrive at a remote wedding venue with zero cell signal, you can still view addresses, timeline cues, and scan barcodes.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Your 'My Day' Dashboard: Call Times, Schedules & Addresses",
        "category": "Field Crew & Mobile Playbook",
        "route": "mobile-field-crew-guide",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "Everything you need to start your shift: call times, venue loading docks, client phone numbers, and 1-tap GPS directions.",
        "content": """
<h2>Your 'My Day' Dashboard</h2>
<p>When you start your shift, the <strong>My Day</strong> screen gives you a crystal-clear summary of what you need to do today.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Check Your Call Times</h3>
      <p>Review the exact timeline:</p>
      <ul>
        <li><strong>Shop Call Time:</strong> When you need to arrive at the warehouse to load the truck.</li>
        <li><strong>On-Site Arrival Time:</strong> When the venue requires you to be at the loading dock.</li>
        <li><strong>Event Start Time:</strong> When music/entertainment must be live and ready for guests.</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>1-Tap GPS Navigation</h3>
      <p>Tap the <strong>Navigate</strong> button next to the venue address. It will immediately open Apple Maps, Google Maps, or Waze with real-time traffic routing.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Read Site Logistics & Gate Codes</h3>
      <p>Check the <em>Venue Notes</em> section before arriving. It will inform you of gate passcodes, whether there are stairs or service elevators, and the location of high-power 20A electrical outlets.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "1-Tap Milestone Updates: Dispatched to Teardown",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-event-milestone-status-updates",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "How updating your event status keeps dispatch informed and sends automated arrival texts to the client.",
        "content": """
<h2>Updating Event Status in the Field</h2>
<p>Managers and clients need to know where you are without having to call and distract you while driving. Update your status with one tap.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Tap 'En Route' When Leaving Shop</h3>
      <p>When your vehicle pulls out of the warehouse, tap <strong>En Route</strong>. This automatically sends a professional text to the client: <em>"Your entertainment team is on the way! Estimated arrival in 25 mins."</em></p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Tap 'On Site' Upon Arrival</h3>
      <p>When you pull into the venue loading zone, tap <strong>On Site</strong>. This timestamps your arrival on dispatch records.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Tap 'Event Live' After Sound Check</h3>
      <p>When your booth is assembled, music is sound-checked, or inflatables are fully staked and inflated, tap <strong>Event Live</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Tap 'Cleared' After Teardown</h3>
      <p>When all equipment is packed back into the van and the venue floor is clean, tap <strong>Teardown Complete</strong>.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Barcode Scanning Warehouse Gear (Scan to Truck & Check-In)",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-equipment-scan-loadout-checkin",
        "role": "Crew",
        "level": "Intermediate",
        "read_time": "4 min read",
        "summary": "Use your phone camera to scan gear barcodes during truck loading so you never leave a cord or mic behind.",
        "content": """
<h2>Scanning Equipment In & Out</h2>
<p>Forgetting a power supply or wireless microphone can ruin a gig. Our built-in barcode scanner ensures every item on your pull sheet is packed.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open 'Scan to Truck'</h3>
      <p>In your mobile app, tap <strong>Scan Gear</strong> on your event card.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Scan Item Barcodes</h3>
      <p>Point your phone's camera at the barcode or QR sticker on the equipment (speakers, booth shells, inflatable bags, blower totes). A green checkmark sounds as each item is verified.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Verify Pull Sheet Completion</h3>
      <p>If you try to depart with items un-scanned, the app alerts you with a list of missing equipment.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Return Check-In at Warehouse</h3>
      <p>When unloading at the end of the night, tap <strong>Check-In</strong> and scan items back into their designated warehouse bays.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Reporting Broken Gear or Site Incidents with On-Site Photos",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-reporting-gear-damage-on-site",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "How to photograph damaged gear or venue problems on site so maintenance can fix it before the next event.",
        "content": """
<h2>Reporting Damage & On-Site Issues</h2>
<p>Equipment takes a beating on the road. If a speaker buzzes, an inflatable seam tears, or a venue cable breaks, report it immediately from your phone.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Tap 'Report Issue'</h3>
      <p>On your event screen, tap the red <strong>Report Issue / Damage</strong> button.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Snap Quick Photos</h3>
      <p>Take 1–2 clear photos of the damage (e.g., frayed cable, cracked casing, or puncture).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Select Issue Severity</h3>
      <ul>
        <li><strong>Minor Cosmetic:</strong> Still usable for upcoming gigs, needs touch-up.</li>
        <li><strong>Urgent Maintenance:</strong> Needs immediate repair before next weekend.</li>
        <li><strong>Safety Hazard / Quarantine:</strong> Equipment cannot be used safely; lock item immediately.</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Submit</h3>
      <p>Tapping submit marks the asset in warehouse maintenance so dispatch will not mistakenly assign the broken unit to another event tomorrow.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Reading the Digital Run Sheet & Timeline on Event Day",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-digital-run-sheet-timeline",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "4 min read",
        "summary": "Follow the live event timeline, see must-play songs, pronounce VIP names correctly, and check off cues.",
        "content": """
<h2>Using Your Digital Run Sheet</h2>
<p>Your digital run sheet replaces soggy, printed paper schedules with an up-to-the-minute live event schedule.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Run Sheet</h3>
      <p>In your crew app, tap <strong>View Run Sheet</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Follow Event Cues</h3>
      <p>Follow along minute-by-minute: Cocktail Hour, Grand Entrance, Toast Speeches, Dinner, Cake Cutting, and Last Dance.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Check Name Pronunciations</h3>
      <p>Tap on the <em>VIP Names</em> section to see phonetic spellings (e.g., <em>Nguyen -> WIN</em> or <em>Kowalski -> ko-VAHL-skee</em>) so you never butcher a name on the microphone.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Access Client Song Choices</h3>
      <p>The client's Must-Play and Do-Not-Play lists are embedded directly in the run sheet for instant reference during open dancing.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Tracking Hours, Clock-In Timesheets & Shift Pay",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-clocking-hours-timesheets",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "Clock in and out with 1 tap, review shift hours, and record client-requested overtime.",
        "content": """
<h2>Clocking In & Managing Timesheets</h2>
<p>Ensuring you get paid accurately for every hour worked is simple.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Clock In</h3>
      <p>When you arrive at the shop or event location, tap <strong>Clock In</strong> at the top of your app.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Clock Out & Overtime Notes</h3>
      <p>When unloading and teardown are complete, tap <strong>Clock Out</strong>. If the client asked you to stay an extra hour, check the <em>Client Overtime</em> box and enter the additional minutes.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Review Your Timesheets</h3>
      <p>Visit the <strong>Earnings & Timesheets</strong> tab in your app to review past shifts, approved hours, and upcoming pay amounts.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Tracking Your Earnings, Commissions & Tip Pool Payouts",
        "category": "Field Crew & Mobile Playbook",
        "route": "crew-tracking-earnings-tips",
        "role": "Crew",
        "level": "Beginner",
        "read_time": "3 min read",
        "summary": "View your base pay, event bonuses, and your share of client credit card tips deposited directly to your card.",
        "content": """
<h2>Your Earnings & Tip Payouts</h2>
<p>Transparency in worker pay is built into Entertainment Express.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Earnings</h3>
      <p>In your employee app, navigate to <strong>Earnings</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>View Detailed Pay Breakdown</h3>
      <p>Each completed event shows your earnings breakdown:</p>
      <ul>
        <li>Base Gig or Hourly Pay</li>
        <li>Lead Worker / Driver Surcharge</li>
        <li>Sales Commission (if you booked or upsold the gig)</li>
        <li>Your Share of the Digital Tip Pool</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Instant Card Payouts</h3>
      <p>If your company has enabled Stripe Instant Payouts, your tips and gig earnings can transfer directly to your debit card within 30 minutes of event teardown.</p>
    </div>
  </div>
</div>
"""
    },

    # =========================================================================
    # 5. APIS, HARDWARE & WEBHOOKS
    # =========================================================================
    {
        "title": "REST API Endpoints & Webhook Integration Reference",
        "category": "APIs, Hardware & Webhooks",
        "route": "rest-api-webhooks-reference",
        "role": "Developer",
        "level": "Advanced",
        "read_time": "6 min read",
        "summary": "Technical reference for integrating custom lead forms, querying real-time booking availability, and subscribing to webhooks.",
        "content": """
<h2>REST API & Webhooks Technical Reference</h2>
<p>Integrate your custom marketing website, Zapier automations, or internal CRM using our standard REST API endpoints.</p>

<h3>Authentication</h3>
<p>Authenticate all REST API requests by supplying your API Key and Secret in the HTTP Authorization header:</p>
<pre><code>Authorization: token api_key:api_secret</code></pre>

<h3>Core Endpoints</h3>
<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Query Availability</h3>
      <code>GET /api/method/entertainment_express.api.booking.get_availability</code>
      <p>Parameters: <code>start_date</code>, <code>end_date</code>, <code>service_package</code>, <code>postal_code</code>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Submit New Booking Lead</h3>
      <code>POST /api/method/entertainment_express.api.booking.create_lead</code>
      <p>Accepts JSON payload with client contact details, event date, guest count, and service preferences.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Live Documentation Search API</h3>
      <code>GET /api/method/entertainment_express.api.docs.search_documentation</code>
      <p>Parameters: <code>query</code>, <code>role</code> (Owner, Crew, Client), <code>category</code>.</p>
    </div>
  </div>
</div>

<h3>Webhook Notifications</h3>
<p>Register webhooks to receive real-time JSON payloads when events occur:</p>
<ul>
  <li><code>lead.created</code> - New prospect inquiry submitted.</li>
  <li><code>proposal.viewed</code> - Client opened interactive proposal.</li>
  <li><code>contract.signed</code> - Client digitally signed the agreement.</li>
  <li><code>payment.received</code> - Deposit or balance payment successfully settled.</li>
  <li><code>event.completed</code> - Crew clocked out and marked teardown complete.</li>
</ul>
"""
    },
    {
        "title": "DJ Software Playlist Export (VirtualDJ, Serato, Rekordbox)",
        "category": "APIs, Hardware & Webhooks",
        "route": "dj-software-playlist-export",
        "role": "Developer",
        "level": "Intermediate",
        "read_time": "4 min read",
        "summary": "How to export client-submitted Must-Play and Do-Not-Play lists into native Serato, Rekordbox, or VirtualDJ folders.",
        "content": """
<h2>Exporting Music Playlists to DJ Software</h2>
<p>DJs can export a client's music selections directly into their performance software without re-typing song titles.</p>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Open Event Music in Owner or Crew Portal</h3>
      <p>Open the event details card and click the <strong>Music Planning</strong> tab.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Select Export Format</h3>
      <p>Click <strong>Export Playlist</strong> and choose your software:</p>
      <ul>
        <li><strong>Atomix VirtualDJ:</strong> Native <code>.vdjfolder</code> XML format ready to drop into your VirtualDJ Folders directory.</li>
        <li><strong>Serato DJ:</strong> Serato-compatible CSV crate format.</li>
        <li><strong>Pioneer Rekordbox:</strong> Rekordbox XML playlist format.</li>
        <li><strong>Universal:</strong> Standard <code>.m3u8</code> playlist file.</li>
      </ul>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Import Into Performance Rig</h3>
      <p>Load the crate into your performance laptop before heading to the gig. Your Must-Play, Special Dance, and Guest Request tracks will be neatly organized into crates.</p>
    </div>
  </div>
</div>
"""
    },
    {
        "title": "Calendar Synchronization: Google Calendar & Microsoft 365 Outlook",
        "category": "APIs, Hardware & Webhooks",
        "route": "calendar-google-outlook-sync",
        "role": "Developer",
        "level": "Intermediate",
        "read_time": "5 min read",
        "summary": "Connect two-way live calendar sync for event bookings, crew call times, and personal calendar busy-time conflict detection.",
        "content": """
<h2>Two-Way Calendar Synchronization</h2>
<p>Keep your entire event schedule synchronized across your mobile devices, Google Calendar, and Microsoft 365 Outlook with automatic conflict prevention.</p>

<div class="callout-box">
  <strong>Live Sync:</strong> When an event booking is confirmed or rescheduled in Entertainment Express, it appears on your Google/Outlook calendar instantly with venue address, client contact info, and digital run-sheet links.
</div>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Navigate to Integrations → Calendars</h3>
      <p>From the Owner Cockpit or Settings menu, open <strong>Integrations</strong> and select <strong>Calendar Feeds & Two-Way Sync</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Choose Your Calendar Provider</h3>
      <p>Select either <strong>Sign in with Google</strong> (Google Calendar) or <strong>Sign in with Microsoft</strong> (Office 365 / Outlook). Authorize read/write calendar permissions.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Configure Sync Rules & Privacy</h3>
      <p>Choose whether to sync all confirmed bookings, tentative leads, or only gigs assigned to specific crew members. Enable <strong>Busy Time Blocking</strong> so private appointments on your personal calendar automatically block availability on your booking calendar.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Subscribe via iCal on Mobile Phones</h3>
      <p>For field crew who prefer not to link full Google accounts, copy the secure, tokenized <strong>iCal Subscription URL</strong>. Crew can subscribe to their personal dispatch calendar directly in Apple Calendar or Android Calendar.</p>
    </div>
  </div>
</div>

<div class="tip-box">
  <strong>Pro Tip:</strong> Event updates in Entertainment Express automatically update the calendar entry on your phone, including updated timeline cues and venue gate codes.
</div>
"""
    },
    {
        "title": "AI Voice Receptionist & Twilio SMS Webhook Setup",
        "category": "APIs, Hardware & Webhooks",
        "route": "ai-voice-twilio-webhook-setup",
        "role": "Developer",
        "level": "Advanced",
        "read_time": "7 min read",
        "summary": "Configure Dial.ai conversational AI voice phone answering and Twilio SMS webhooks for 24/7 lead capture and client text notifications.",
        "content": """
<h2>AI Voice Phone Receptionist & SMS Webhooks</h2>
<p>Never miss a high-ticket weekend event inquiry. Connect Dial.ai or Twilio to answer missed phone calls, quote instant ballpark pricing, and trigger automated booking text alerts.</p>

<div class="callout-box">
  <strong>24/7 Voice Answering:</strong> When you are on site at an event or asleep, your AI voice assistant answers inbound phone calls, checks real-time date availability, answers FAQs, and logs the customer into your leads pipeline.
</div>

<div class="steps-container">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Obtain Your Webhook Secret & Credentials</h3>
      <p>In the Owner Cockpit, go to <strong>Settings → Webhooks & Telephony</strong>. Copy your unique tenant <strong>Webhook Ingest URL</strong> and <strong>HMAC Signature Secret</strong>.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Configure Dial.ai or Twilio Phone Number</h3>
      <p>Log into your Dial.ai or Twilio console. Set the voice webhook URL to your Entertainment Express endpoint (<code>https://&lt;your-subdomain&gt;.app.entx.app/api/method/entertainment_express.integrations.telephony.handle_call</code>).</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Set Up Inbound Lead Prompts</h3>
      <p>Define your business knowledge base: event types served, minimum booking fees, service radius, and FAQs. The AI receptionist will ask callers for their event date, venue city, and guest count.</p>
    </div>
  </div>

  <div class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3>Verify Instant Lead Creation & SMS Alerts</h3>
      <p>Place a test call to your number. As soon as the caller hangs up, Entertainment Express creates a new Lead, sends an SMS confirmation to the caller with a proposal link, and notifies the business owner via mobile push notification.</p>
    </div>
  </div>
</div>

<div class="tip-box">
  <strong>Pro Tip:</strong> All call transcripts and audio recordings are attached directly to the Lead record in the Owner Cockpit for instant review.
</div>
"""
    }
]

def seed_documentation_data():
    """Idempotently seed documentation categories and production-ready help articles."""
    try:
        if not frappe.db.exists("DocType", "Help Category") or not frappe.db.exists("DocType", "Help Article"):
            frappe.logger("entertainment_express").info("Frappe Help Category/Article DocTypes not present; skipping DB doc seed.")
            return

        for cat in SEED_CATEGORIES:
            cat_name = cat["category_name"]
            if not frappe.db.exists("Help Category", cat_name):
                doc = frappe.get_doc({
                    "doctype": "Help Category",
                    "category_name": cat_name,
                    "published": 1,
                    "route": f"docs/{cat['route']}"
                })
                doc.insert(ignore_permissions=True)

        for art in SEED_ARTICLES:
            title = art["title"]
            existing = frappe.db.get_value("Help Article", {"title": title}, "name")
            if not existing:
                doc = frappe.get_doc({
                    "doctype": "Help Article",
                    "title": title,
                    "category": art["category"],
                    "content": art["content"],
                    "published": 1,
                    "route": f"docs/{art['route']}"
                })
                doc.insert(ignore_permissions=True)
            else:
                # Update existing article content to latest production-ready version
                doc = frappe.get_doc("Help Article", existing)
                doc.category = art["category"]
                doc.content = art["content"]
                doc.published = 1
                doc.route = f"docs/{art['route']}"
                doc.save(ignore_permissions=True)
                
        frappe.db.commit()
    except Exception as e:
        frappe.logger("entertainment_express").warning(f"Failed to seed documentation data: {e}")
