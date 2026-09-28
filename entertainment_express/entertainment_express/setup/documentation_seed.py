import frappe
from frappe.utils import slug

SEED_CATEGORIES = [
    {
        "category_name": "Getting Started & Onboarding",
        "route": "getting-started",
        "description": "Essential guides for onboarding your entertainment business, configuring company settings, and domain setup.",
        "icon": "rocket"
    },
    {
        "category_name": "Owner Operations & Inventory",
        "route": "owner-operations",
        "description": "Managing your service catalog, asset availability, production BOMs, pricing rules, and job costing.",
        "icon": "briefcase"
    },
    {
        "category_name": "Field Crew & Mobile Playbook",
        "route": "field-crew",
        "description": "Step-by-step guides for drivers, DJs, technicians, and attendants using the mobile field app PWA.",
        "icon": "smartphone"
    },
    {
        "category_name": "Client & Guest Experience",
        "route": "client-experience",
        "description": "How clients interact with proposals, e-signatures, planning forms, timelines, and music request feeds.",
        "icon": "heart"
    },
    {
        "category_name": "REST API & Integrations",
        "route": "api-integrations",
        "description": "Developer documentation for REST API endpoints, webhooks, calendar sync, and third-party tools.",
        "icon": "code"
    }
]

SEED_ARTICLES = [
    {
        "title": "Welcome to Entertainment Express: Platform Overview",
        "category": "Getting Started & Onboarding",
        "route": "welcome-platform-overview",
        "role": "All Users",
        "level": "Beginner",
        "content": """
<h2>Welcome to Entertainment Express</h2>
<p>Entertainment Express (EE) is the enterprise-grade, all-in-one operations platform built specifically for mobile entertainment companies — including DJs, bounce house & inflatable rentals, photo booths, game trucks, casino parties, and talent performers.</p>

<h3>Core Capabilities</h3>
<ul>
  <li><strong>Multi-Tenant Workspace:</strong> Your business operates in an isolated, branded environment with customizable subdomains or custom domains.</li>
  <li><strong>Role-Based Access:</strong> Dedicated experience layers for <em>Owners</em> (cockpit & reporting), <em>Field Crew</em> (mobile PWA run sheets & check-ins), and <em>Clients</em> (proposals, planning forms, payments).</li>
  <li><strong>Unified Revenue Loop:</strong> Automate leads, instant interactive proposals, e-signatures, initial deposit collections, and automated balance reminders.</li>
</ul>

<h3>Quick Start Steps</h3>
<ol>
  <li>Go to <strong>Settings & White Labeling</strong> to upload your logo and set your primary brand accent colors.</li>
  <li>Define your <strong>Service Catalog</strong> and package add-ons in the Owner Operations tab.</li>
  <li>Add your <strong>Equipment Assets</strong> to enable automated collision prevention and stock availability locks.</li>
  <li>Invite your <strong>Field Crew</strong> and configure gig rate cards and tip pool permissions.</li>
</ol>
"""
    },
    {
        "title": "Configuring Custom Domains & White-Label Branding",
        "category": "Getting Started & Onboarding",
        "route": "custom-domains-white-label",
        "role": "Owner",
        "level": "Intermediate",
        "content": """
<h2>White-Label Customization Guide</h2>
<p>Make Entertainment Express feel entirely like your own proprietary software platform.</p>

<h3>Brand Kit Setup</h3>
<p>Navigate to <code>/owner/brand</code> to customize visual elements:</p>
<ul>
  <li><strong>Primary Accent Color:</strong> Controls buttons, active portal highlights, and proposal badges.</li>
  <li><strong>Company Logo & Favicon:</strong> Displayed across client portals, PDF contracts, and email footers.</li>
  <li><strong>Custom Email Header/Footer:</strong> Tailor default transactional message headers with your support links.</li>
</ul>

<h3>Connecting Your Custom Domain</h3>
<p>You can run your public booking page and customer portal directly under your domain (e.g., <code>portal.yourcompany.com</code>):</p>
<ol>
  <li>Add a <code>CNAME</code> record in your DNS provider pointing to <code>entx.app</code>.</li>
  <li>In <strong>Domain Settings</strong> inside the Owner Portal, enter your custom domain name.</li>
  <li>Our automated system will issue a free LetsEncrypt SSL certificate within minutes.</li>
</ol>
"""
    },
    {
        "title": "Service Catalog & Equipment Asset Management",
        "category": "Owner Operations & Inventory",
        "route": "service-catalog-inventory",
        "role": "Owner",
        "level": "Intermediate",
        "content": """
<h2>Service Catalog & Asset Management</h2>
<p>Entertainment Express manages what you sell separately from physical assets to prevent double-bookings.</p>

<h3>Service Packages vs. Bookable Assets</h3>
<ul>
  <li><strong>Service Packages:</strong> The sellable product listed on quotes (e.g., <em>"360 Photo Booth 4-Hour Package"</em> or <em>"Dual Water Slide Rental"</em>).</li>
  <li><strong>Equipment Assets:</strong> Physical inventory items (e.g., <em>"360 Booth Unit #2"</em> or <em>"Tropical Slide #1"</em>).</li>
</ul>

<h3>Setting Up Production BOMs (Bill of Materials)</h3>
<p>Bundle physical inventory items required to fulfill a service. When a package is booked, EE automatically locks the bundled gear for the event duration plus turnaround setup time.</p>
"""
    },
    {
        "title": "Job Costing, Margin Defense & Direct COGS",
        "category": "Owner Operations & Inventory",
        "route": "job-costing-margin-defense",
        "role": "Owner",
        "level": "Advanced",
        "content": """
<h2>Real-Time Event Profitability</h2>
<p>Track direct cost of goods sold (COGS) for every job before and after execution.</p>

<h3>Cost Factors Tracked</h3>
<ul>
  <li><strong>Direct Labor:</strong> Worker base pay + gig commissions + bonus rates.</li>
  <li><strong>Subcontractor Fees:</strong> Partner overflow costs or external gear rentals.</li>
  <li><strong>Vehicle Transit & Wear:</strong> Calculated mileage and delivery fuel surcharges.</li>
  <li><strong>Payment Processing Fees:</strong> Stripe/Square transaction costs automatically calculated per invoice.</li>
</ul>

<h3>Margin Floor Warnings</h3>
<p>If a custom quote discount causes expected profit margin to fall below your target threshold (e.g., 35%), the system flags a warning prior to sending proposals to clients.</p>
"""
    },
    {
        "title": "Mobile Field PWA & Offline Run Sheet Guide",
        "category": "Field Crew & Mobile Playbook",
        "route": "mobile-field-crew-guide",
        "role": "Crew",
        "level": "Beginner",
        "content": """
<h2>Field Crew Mobile App Guide</h2>
<p>Field workers use the lightweight PWA at <code>/employee</code> on mobile phones, with full offline capability in low-signal areas.</p>

<h3>Key Crew Workflows</h3>
<ul>
  <li><strong>My Day Dashboard:</strong> View scheduled gigs, event addresses, client contact details, and call times.</li>
  <li><strong>Interactive Check-In:</strong> Tap to record <em>Dispatched</em>, <em>En Route</em>, <em>On Site</em>, and <em>Cleared</em> timestamps.</li>
  <li><strong>Barcode Scanning:</strong> Scan equipment barcodes during loading and teardown to verify zero missing gear.</li>
  <li><strong>Damage Quarantine:</strong> Capture photos of damaged gear on-site with instant notification to management.</li>
</ul>
"""
    },
    {
        "title": "Client Portal: Interactive Proposals, E-Sign & Planning",
        "category": "Client & Guest Experience",
        "route": "client-portal-proposals-planning",
        "role": "Client",
        "level": "Beginner",
        "content": """
<h2>Client Portal Guide</h2>
<p>Clients manage their event details, contracts, and music selections seamlessly in <code>/client</code>.</p>

<h3>Client Steps to Confirm an Event</h3>
<ol>
  <li><strong>Review Interactive Proposal:</strong> Select add-ons, choose package upgrades, and view price calculations.</li>
  <li><strong>Sign Digital Contract:</strong> Complete legally binding e-signatures directly on phone or desktop.</li>
  <li><strong>Pay Deposit:</strong> Securely pay using credit card, Apple Pay, or bank transfer.</li>
  <li><strong>Complete Planning Forms & Timeline:</strong> Fill out event details (e.g., grand entrance song, special announcements, timeline schedule).</li>
</ol>
"""
    },
    {
        "title": "REST API Endpoints & Webhook Integration Reference",
        "category": "REST API & Integrations",
        "route": "rest-api-webhooks-reference",
        "role": "Developer",
        "level": "Advanced",
        "content": """
<h2>REST API & Webhooks Technical Reference</h2>
<p>Integrate custom websites, CRM automations, or Zapier workflows using standard HTTP REST endpoints.</p>

<h3>Authentication</h3>
<p>Authenticate API calls using Frappe API Tokens in the HTTP Authorization header:</p>
<pre><code>Authorization: token api_key:api_secret</code></pre>

<h3>Core API Endpoints</h3>
<ul>
  <li><code>GET /api/method/entertainment_express.api.booking.get_availability</code> - Query availability for given date/time and service types.</li>
  <li><code>POST /api/method/entertainment_express.api.booking.create_lead</code> - Create a new booking lead from external custom web forms.</li>
  <li><code>GET /api/method/entertainment_express.api.docs.search_documentation</code> - Live search help documentation articles.</li>
</ul>

<h3>Webhook Events</h3>
<p>Register webhooks for real-time notifications on <code>booking.created</code>, <code>contract.signed</code>, <code>payment.received</code>, and <code>event.completed</code>.</p>
"""
    }
]

def seed_documentation_data():
    """Idempotently seed documentation categories and production-ready help articles."""
    try:
        # Check if Help Category doctype exists in frappe
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
            if not frappe.db.exists("Help Article", {"title": title}):
                doc = frappe.get_doc({
                    "doctype": "Help Article",
                    "title": title,
                    "category": art["category"],
                    "content": art["content"],
                    "published": 1,
                    "route": f"docs/{art['route']}",
                    "level": art.get("level", "Beginner"),
                    "likes": 12
                })
                doc.insert(ignore_permissions=True)
                
        frappe.db.commit()
    except Exception as e:
        frappe.logger("entertainment_express").warning(f"Failed to seed documentation data: {e}")
