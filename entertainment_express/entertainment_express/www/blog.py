"""
Resource Center & Blog Hub for Entertainment Express.
Provides curated industry playbooks, guides, operational advice, and Frappe Blog Post integration.
"""

from __future__ import annotations

import html
import json
import re

import frappe
from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


CATEGORIES = [
    {"slug": "all", "name": "All Topics", "icon": "✨"},
    {"slug": "operations-risk", "name": "Operations & Risk", "icon": "🌦️"},
    {"slug": "logistics-fleet", "name": "Logistics & Fleet", "icon": "🚚"},
    {"slug": "mobile-djs", "name": "Mobile DJs & MCs", "icon": "🎧"},
    {"slug": "rentals-inflatables", "name": "Party & Inflatables", "icon": "🏰"},
    {"slug": "growth-sales", "name": "Growth & Sales", "icon": "📈"},
    {"slug": "industry-trends", "name": "Industry Trends", "icon": "⚡"},
]

CURATED_PLAYBOOKS = [
    {
        "slug": "severe-weather-rain-date-protocols",
        "title": "The Operator's Blueprint: Severe Weather Protocols & Rain-Date Management",
        "subtitle": "How multi-crew inflatable and outdoor event companies eliminate refund chaos, automate weather holds, and protect $50K+ in peak-season bookings.",
        "excerpt": "Discover how high-volume party rental and outdoor event operators eliminate cancellation disputes, automate wind and rain risk thresholds, and preserve customer trust during unpredictable weekend weather.",
        "category": "Operations & Risk",
        "category_slug": "operations-risk",
        "author_name": "Marcus Vance",
        "author_title": "Head of Operations",
        "author_initials": "MV",
        "read_time": "6 min read",
        "published_on": "Sep 4, 2026",
        "featured": True,
        "takeaways": [
            "Define strict, objective wind & precipitation cancellation triggers in your rental contracts (ASTM F2374 standards).",
            "Automate 48-hour and 24-hour weather check-in sequences to proactively manage customer expectations.",
            "Implement standardized rain-check credit policies rather than direct cash refunds to protect seasonal cash flow.",
            "Use dynamic staging queues so high-risk outdoor setups can be shifted to indoor/covered alternatives quickly.",
        ],
        "content_html": """
<p class="ee-lead">For outdoor event rental operators and multi-crew party services, weather is not an unexpected surprise—it is an inevitability. Every spring and summer, operators face the identical dilemma: a weekend forecast shows a 60% chance of afternoon thunderstorms and 20 mph gusts. Without clear protocols, you face angry customers demanding day-of cash refunds, stranded crews, and damaged equipment.</p>

<h2>1. Establishing Objective Safety Thresholds (ASTM F2374)</h2>
<p>The single most important rule in severe weather management is removing subjectivity. Never let a dispatcher, customer, or field attendant make a subjective "guess" about whether inflatable equipment or outdoor stages can remain operational.</p>
<p>For inflatable bounces and water slides, ASTM F2374 guidelines dictate that units must be deflated immediately whenever wind gusts exceed 15–20 mph. Document this prominently in your client agreements with an explicit wind-hold clause:</p>
<blockquote>"If sustained winds exceed 15 mph or gusts exceed 20 mph, or if lightning is detected within a 10-mile radius, the lessee agrees to immediately evacuate and deflate the attraction until conditions normalize."</blockquote>

<h2>2. The 48-Hour Decision Matrix</h2>
<p>Chaos happens when weather decisions are deferred until Saturday morning at 7:00 AM. Top-tier operators enforce a structured 3-stage weather sequence:</p>
<table>
  <thead>
    <tr>
      <th>Timeline</th>
      <th>Trigger</th>
      <th>Action Plan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>T-48 Hours</strong></td>
      <td>Precipitation forecast &gt; 50% or winds &gt; 18 mph</td>
      <td>Automated SMS to client: Weather Watch active. Client invited to confirm indoor contingency or choose rain-date hold.</td>
    </tr>
    <tr>
      <td><strong>T-24 Hours</strong></td>
      <td>Forecast confirmed hazardous</td>
      <td>Operator Decision Gate: Dispatch locks in whether unit can be secured indoors or rescheduled to alternate date.</td>
    </tr>
    <tr>
      <td><strong>Day of Event</strong></td>
      <td>Sudden local storm / lightning &lt; 10 mi</td>
      <td>Crew leader automated halt. System issues hold notification to client portal with timer.</td>
    </tr>
  </tbody>
</table>

<h2>3. Protecting Cash Flow: Rain-Date Credits vs. Refunds</h2>
<p>One of the fatal mistakes of growing rental operators is issuing cash refunds for weather cancellations. When Saturday morning wipes out 25 bookings, refunding deposits can drain $15,000 to $40,000 from operating accounts overnight, even though staff and load planning time have already been incurred.</p>
<p>Instead, implement a <strong>12-Month Flexible Weather Credit</strong>. If an event is cancelled prior to truck dispatch due to verified severe weather, 100% of the client's deposit is credited to their account, valid for any booking within 365 days. In Entertainment Express, this credit is automatically assigned to the client profile and can be redeemed with one click on their next booking portal checkout.</p>

<h2>4. Automated Crew Dispatch & Load Rerouting</h2>
<p>When weather forces cancellations or shifts from grass stakes to sandbag ballast on concrete, truck load planning changes instantly. Having dispatch software that automatically adjusts vehicle weight manifests and alerts warehouse loading staff ensures that crews never arrive on site with improper anchoring hardware.</p>
""",
    },
    {
        "slug": "dispatch-box-truck-logistics-peak-weekends",
        "title": "From Chaos to Clockwork: Load-Planning & Fleet Logistics for 20+ Event Weekends",
        "subtitle": "Stop packing trucks from memory. How staging zones, digital manifests, and equipment turnaround workflows prevent forgotten cables and delayed setups.",
        "excerpt": "A field-tested operational system for multi-vehicle entertainment fleets: turnaround staging, load sequences, driver manifests, and pre-departure checklists.",
        "category": "Logistics & Fleet",
        "category_slug": "logistics-fleet",
        "author_name": "Sarah Jenkins",
        "author_title": "Logistics Director",
        "author_initials": "SJ",
        "read_time": "5 min read",
        "published_on": "Aug 28, 2026",
        "featured": False,
        "takeaways": [
            "Staging bays must mirror route drop-off order: first item delivered is loaded last (LIFO).",
            "Eliminate manual paper manifests with mobile QR-code load scanning on departure and return.",
            "Buffer 30 minutes of turnaround inspection between Saturday afternoon and evening double-bookings.",
            "Track equipment sub-rentals in real-time to avoid costly day-of cross-rent scrambling.",
        ],
        "content_html": """
<p class="ee-lead">At 6:30 AM on a Saturday morning, nothing creates panic faster than realizing a box truck loaded with $80,000 in sound gear and inflatables is missing a specific 50-foot heavy-duty extension cord or blower motor. When you operate more than three vehicles, packing by memory guarantees forgotten equipment.</p>

<h2>1. The LIFO Rule (Last In, First Out)</h2>
<p>The cardinal rule of event logistics is LIFO loading. Warehouse loading bays must be laid out in sequential order corresponding to each route's stops. The equipment for Stop 1 must always be loaded last so it is immediately accessible when the roll-up door opens.</p>

<h2>2. Digital Load Manifests with Photo Verification</h2>
<p>Paper packing slips get dropped in puddles, blown across parking lots, or lost under truck seats. Mobile-first dispatch workflows give drivers and load captains digital checklists with item serial numbers and required ancillary accessories (blowers, sandbags, stakes, speaker poles, cables).</p>
<p>Requiring the load captain to snap a single wide-angle photo of the strapped-in truck cargo before departure creates an immutable audit trail and drastically reduces in-transit damage claims.</p>

<h2>3. Turnaround Buffer Zones for Double-Booked Gear</h2>
<p>When high-demand items (like popular 360 photo booths or obstacle courses) are booked twice on Saturday—once from 11 AM - 3 PM and again from 7 PM - 11 PM—logistics failure happens during the transfer. Always enforce a minimum 45-minute depot inspection buffer to clean, sanitize, and test equipment before re-dispatching to the evening client.</p>
""",
    },
    {
        "slug": "automating-mobile-dj-music-requests-tipping",
        "title": "Automating the Crowd: How Top Mobile DJs Modernize Music Requests & Tipping",
        "subtitle": "Replace soggy napkins and unvetted Spotify links with branded QR code portals, crowd upvoting, and seamless VirtualDJ/Serato cue export.",
        "excerpt": "Why modern event hosts demand digital crowd interaction, and how mobile DJs use automated request filtering to boost crowd energy and add $400+ in tips every weekend.",
        "category": "Mobile DJs & MCs",
        "category_slug": "mobile-djs",
        "author_name": "DJ Julian 'K-Rex' Rivera",
        "author_title": "Resident DJ & Product Advisor",
        "author_initials": "JR",
        "read_time": "4 min read",
        "published_on": "Aug 21, 2026",
        "featured": False,
        "takeaways": [
            "Tabletop QR cards let guests submit requests directly from their smartphones without crowding the DJ booth.",
            "Built-in 'Do Not Play' filters automatically reject prohibited tracks configured in advance by the client.",
            "Export approved requests straight into M3U or VirtualDJ/Serato crate formats before and during the set.",
            "Integrated digital tipping (Apple Pay, Venmo, Stripe) increases per-event artist earnings by an average of 28%.",
        ],
        "content_html": """
<p class="ee-lead">Every mobile DJ knows the feeling: you are in the middle of executing a seamless harmonic transition, and a guest leans over your booth, shouting a song request into your ear while hovering an open beverage over your $3,000 controller. There is a better way.</p>

<h2>1. The Self-Service Guest Request Portal</h2>
<p>By placing subtle, elegant acrylic signs with QR codes on guest tables or the bar, event attendees can browse curated song selections and submit requests directly from their phones. Guests see what's already playing, upvote popular tracks, and receive instant on-screen feedback.</p>

<h2>2. Strict 'Do Not Play' Rule Enforcement</h2>
<p>If the bride has placed the 'Macarena' or specific explicit tracks on the event's Do Not Play list in her client portal, the guest request engine immediately informs the guest: <em>'The host has requested that this genre/track remain off the playlist tonight!'</em> The DJ is spared the awkwardness of saying no, and host boundaries are seamlessly respected.</p>

<h2>3. Direct Software Crate Sync</h2>
<p>With modern DJ integrations, approved guest requests don't sit in a separate phone app. They sync directly into live VirtualDJ or Serato crates, complete with BPM and key metadata, allowing the DJ to weave requests into the set organically.</p>
""",
    },
    {
        "slug": "scaling-photo-booth-activations-multiple-units",
        "title": "Scaling Photo Booth Activations from 1 to 5 Units Every Weekend",
        "subtitle": "The operational checklist, contractor dispatch rules, and client instant-gallery delivery workflows that turn photo booth side-hustles into six-figure operations.",
        "excerpt": "Operational checklists, gear standardization, and unattended drop-off workflows to scale photo booth activations across weddings, corporate galas, and festivals.",
        "category": "Growth & Sales",
        "category_slug": "growth-sales",
        "author_name": "Elena Rostova",
        "author_title": "Booth Operations Lead",
        "author_initials": "ER",
        "read_time": "7 min read",
        "published_on": "Aug 15, 2026",
        "featured": False,
        "takeaways": [
            "Standardize every photo booth kit down to identical cable lengths, printer models, and Pelican flight cases.",
            "Separate attendant roles: hire setup/strike technicians and guest-facing social hosts for high-tier galas.",
            "Automated client galleries with live SMS sharing generate 3x more post-event referral bookings.",
            "Implement remote kiosk telemetry (paper roll levels, camera connectivity, printer temperature) to detect issues before guests do.",
        ],
        "content_html": """
<p class="ee-lead">Photo booths offer some of the highest gross margins in the event industry (often exceeding 75%). Yet many operators get stuck at 1 or 2 units because running five simultaneous events on a Saturday night feels like an operational nightmare.</p>

<h2>1. Absolute Gear Standardization</h2>
<p>To scale past 2 units, every single kit must be identical. If Booth A uses a DNP DS620A printer and Booth B uses a Citizen printer with different media sizes, your warehouse staff will inevitably pack the wrong paper roll. Standardize on one printer, one ring-light model, and pre-wired flight cases with single-plug power hookups.</p>

<h2>2. The 'Drop & Go' vs. 'White Glove Host' Model</h2>
<p>Segment your offerings into unattended digital-only booths (ideal for corporate happy hours and daytime activations) and staffed high-touch print booths for luxury weddings. Unattended units allow a single delivery driver to service 4 events in one afternoon, compounding your revenue per crew hour.</p>

<h2>3. Viral Word-of-Mouth via Branded Digital Galleries</h2>
<p>Every photo sent to a guest via SMS or AirDrop should include an elegant link to a white-labeled online gallery featuring your company branding and an unobtrusive 'Book This Booth for Your Event' CTA button. In practice, this generates 25% of all new photo booth inquiries without spending a dime on paid advertising.</p>
""",
    },
    {
        "slug": "modern-entertainment-tech-stack-2026",
        "title": "The 2026 Live Entertainment Tech Stack: Why Disconnected Tools Are Slowing You Down",
        "subtitle": "Why running your entertainment business on disconnected CRMs, spreadsheet inventory, and separate invoicing tools is costing you 15+ hours every week.",
        "excerpt": "A critical breakdown of the hidden costs of software fragmentation in entertainment companies and the business case for a single event operating system.",
        "category": "Industry Trends",
        "category_slug": "industry-trends",
        "author_name": "Dave Channing",
        "author_title": "Product Strategy",
        "author_initials": "DC",
        "read_time": "8 min read",
        "published_on": "Aug 07, 2026",
        "featured": False,
        "takeaways": [
            "The average 5-person entertainment company uses 6 distinct tools: CRM, contracts, scheduling, inventory, invoicing, and texting.",
            "Data handoff errors between separate systems account for 64% of double-booking and billing mistakes.",
            "Consolidating into an all-in-one platform cuts administrative overhead by an average of 14 hours per week.",
            "Native multi-tenant isolation ensures sensitive booking financials and client records are safeguarded.",
        ],
        "content_html": """
<p class="ee-lead">Look at your browser tab bar right now. If you have QuickBooks open in one tab, HoneyBook or InflatableOffice in another, Google Calendar in a third, When I Work or Deputy for crew scheduling, and a mess of Google Sheets for inventory tracking, you are paying a massive 'fragmentation tax'.</p>

<h2>1. The Hidden Cost of the 'Copy-Paste' Workflow</h2>
<p>When a customer confirms a quote in your CRM, someone has to copy that booking date into Google Calendar, generate an invoice in QuickBooks, create a shift offer in your scheduling tool, and reserve gear in inventory. Every copy-paste step is a vector for human error—wrong times, mismatched dates, or unassigned staff.</p>

<h2>2. Unified Real-Time Conflict Detection</h2>
<p>An integrated operating system like Entertainment Express maintains a single source of truth. When a client books an inflatable or DJ setup for October 17th, the system simultaneously verifies staff availability, vehicle load capacity, equipment inventory, and travel distance in real time. If a conflict exists, it is flagged before the contract is sent.</p>
""",
    },
    {
        "slug": "client-portal-secrets-contracts-paid-fast",
        "title": "Client Portal Secrets: Getting Contracts Signed and Balances Paid 3x Faster",
        "subtitle": "How modern white-labeled self-service client portals eliminate awkward payment chasing and shorten booking confirmation from days to minutes.",
        "excerpt": "How self-service timeline builders, integrated e-signatures, and automated reminder sequences transform the customer experience while accelerating cash flow.",
        "category": "Growth & Sales",
        "category_slug": "growth-sales",
        "author_name": "Marcus Vance",
        "author_title": "Head of Operations",
        "author_initials": "MV",
        "read_time": "5 min read",
        "published_on": "Jul 30, 2026",
        "featured": False,
        "takeaways": [
            "78% of modern event clients complete payments and questionnaire details outside of business hours (8 PM - 11 PM).",
            "Eliminating PDF print-and-scan agreements with mobile e-signatures reduces quote-to-close time from 4 days to 42 minutes.",
            "Auto-scheduled installment reminders with one-click payment links reduce past-due balances by over 80%.",
            "Real-time client timeline collaboration keeps wedding coordinators and planners aligned without endless email threads.",
        ],
        "content_html": """
<p class="ee-lead">No event owner enjoys sending awkward follow-up emails: <em>'Just checking in to see if you received the contract PDF and if you can mail the check.'</em> In 2026, modern clients expect the same instant, friction-free checkout experience they receive from Airbnb or DoorDash.</p>

<h2>1. Frictionless Mobile E-Signatures</h2>
<p>When quotes require clients to print, sign with a pen, scan, and email back a PDF, sales cycles stall. Providing a secure, mobile-responsive portal link where clients can review itemized quotes, sign with a finger on their smartphone screen, and pay the deposit via card or Apple Pay closes bookings in minutes rather than days.</p>

<h2>2. Interactive Planning Timelines</h2>
<p>Empower clients with an interactive day-of timeline builder. Couples can specify ceremony start times, grand entrance songs, and cake-cutting schedules directly in their portal. Coordinators and DJs see updates immediately, eliminating contradictory paper itinerary versions.</p>
""",
    },
]


def _build_blog_jsonld(posts: list[dict], base_url: str) -> str:
    """Builds a JSON-LD Blog schema with top posts."""
    items = []
    for p in posts[:6]:
        items.append({
            "@type": "BlogPosting",
            "headline": p.get("title"),
            "description": p.get("excerpt") or p.get("blog_intro") or "",
            "datePublished": p.get("published_on"),
            "author": {
                "@type": "Person",
                "name": p.get("author_name") or "Entertainment Express Editorial Team",
            },
            "url": f"{base_url.rstrip('/')}/blog/{p.get('slug')}",
        })

    payload = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Entertainment Express Resource Center",
        "description": "Guides, playbooks, and tactical insights for modern entertainment company operators.",
        "url": f"{base_url.rstrip('/')}/blog",
        "blogPost": items,
    }
    return json.dumps(payload, indent=2)


def _build_article_jsonld(post: dict, base_url: str) -> str:
    """Builds a JSON-LD BlogPosting schema for a single article."""
    payload = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.get("title"),
        "description": post.get("excerpt") or post.get("subtitle") or "",
        "datePublished": post.get("published_on"),
        "author": {
            "@type": "Person",
            "name": post.get("author_name") or "Entertainment Express Editorial Team",
            "jobTitle": post.get("author_title") or "Industry Expert",
        },
        "publisher": {
            "@type": "Organization",
            "name": "Entertainment Express",
            "url": base_url.rstrip("/"),
            "logo": f"{base_url.rstrip('/')}/assets/entertainment_express/marketing/img/og-default.svg",
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": f"{base_url.rstrip('/')}/blog/{post.get('slug')}",
        },
    }
    return json.dumps(payload, indent=2)


def get_context(context):
    settings = get_marketing_settings()
    base_domain = settings.get("base_domain") or "entx.app"
    base_url = f"https://www.{base_domain}"

    # Check query params for single post or filters
    form_dict = getattr(frappe, "form_dict", {}) or {}
    post_slug = form_dict.get("post") or form_dict.get("post_slug") or ""
    selected_category = form_dict.get("category") or "all"
    search_query = (form_dict.get("q") or "").strip().lower()

    # If routed via URL path like /blog/<post_slug>
    if not post_slug:
        req_path = getattr(frappe.local, "request", None)
        if req_path and hasattr(req_path, "path"):
            path_parts = req_path.path.strip("/").split("/")
            if len(path_parts) >= 2 and path_parts[0] == "blog":
                post_slug = path_parts[1]

    # Combine DB Blog Posts if any exist with Curated Playbooks
    all_posts = list(CURATED_PLAYBOOKS)
    if frappe.db.exists("DocType", "Blog Post"):
        try:
            db_posts = frappe.get_all(
                "Blog Post",
                filters={"published": 1},
                fields=["name", "title", "blog_intro", "route", "published_on", "blogger", "content"],
                order_by="published_on desc",
                limit_page_length=20,
            )
            for dp in db_posts:
                slug = dp.get("route") or dp.get("name")
                if not any(p["slug"] == slug for p in all_posts):
                    all_posts.append({
                        "slug": slug,
                        "title": dp.get("title"),
                        "subtitle": dp.get("blog_intro") or "",
                        "excerpt": dp.get("blog_intro") or "",
                        "category": "Company Updates",
                        "category_slug": "industry-trends",
                        "author_name": dp.get("blogger") or "EE Team",
                        "author_title": "Contributor",
                        "author_initials": (dp.get("blogger") or "EE")[:2].upper(),
                        "read_time": "4 min read",
                        "published_on": str(dp.get("published_on") or "Recently"),
                        "featured": False,
                        "takeaways": [],
                        "content_html": dp.get("content") or f"<p>{dp.get('blog_intro') or ''}</p>",
                    })
        except Exception:
            pass

    # Single Post View
    if post_slug:
        matched_post = next((p for p in all_posts if p["slug"] == post_slug), None)
        if matched_post:
            breadcrumbs = [
                {"label": "Home", "url": "/"},
                {"label": "Blog", "url": "/blog"},
                {"label": matched_post["title"], "url": f"/blog/{matched_post['slug']}"},
            ]
            apply_common_page_context(
                context,
                settings,
                f"{matched_post['title']} | Entertainment Express",
                matched_post.get("excerpt") or matched_post.get("subtitle") or "Entertainment Express Playbook",
                f"/blog/{matched_post['slug']}",
                breadcrumbs=breadcrumbs,
            )
            context.current_post = matched_post
            context.article_json_ld = _build_article_jsonld(matched_post, base_url)
            related = [p for p in all_posts if p["slug"] != matched_post["slug"]]
            context.related_posts = related[:3]
            context.is_single_post = True
            return

    # Blog Hub / List View
    filtered_posts = all_posts
    if selected_category and selected_category != "all":
        filtered_posts = [p for p in filtered_posts if p.get("category_slug") == selected_category]

    if search_query:
        filtered_posts = [
            p
            for p in filtered_posts
            if search_query in p["title"].lower()
            or search_query in p.get("excerpt", "").lower()
            or search_query in p.get("content_html", "").lower()
        ]

    featured_post = None
    if selected_category == "all" and not search_query:
        featured_post = next((p for p in filtered_posts if p.get("featured")), None)
        if not featured_post and filtered_posts:
            featured_post = filtered_posts[0]

    grid_posts = [p for p in filtered_posts if p != featured_post] if featured_post else filtered_posts

    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Blog & Resources", "url": "/blog"},
    ]
    apply_common_page_context(
        context,
        settings,
        "Resource Center & Operational Playbooks | Entertainment Express",
        "Tactical playbooks, dispatch guides, DJ workflows, and growth strategies for modern live entertainment companies.",
        "/blog",
        breadcrumbs=breadcrumbs,
    )

    context.categories = CATEGORIES
    context.selected_category = selected_category
    context.search_query = search_query
    context.featured_post = featured_post
    context.grid_posts = grid_posts
    context.total_posts = len(filtered_posts)
    context.rss_url = "/blog?format=rss"
    context.blog_json_ld = _build_blog_jsonld(filtered_posts, base_url)
    context.is_single_post = False
