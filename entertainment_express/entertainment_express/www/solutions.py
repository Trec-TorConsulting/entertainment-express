import frappe

from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_breadcrumbs,
    build_software_app_jsonld,
    get_marketing_settings,
)


SOLUTIONS = {
    "djs": {
        "name": "Mobile DJs and MCs",
        "headline": "The Operating System for Mobile DJs",
        "summary": "Package management, guest song requests, timeline collaboration, Serato/Rekordbox playlist export, and crew dispatch built for high-end wedding and event DJs.",
        "meta_description": "Mobile DJ booking software with music planning, Serato playlist export, crew dispatch, contracts, and client portal. Replace DJ Event Planner and DJ Intelligence.",
        "pain_points": [
            "Music request lists trapped in endless email threads and paper sheets",
            "Manual, error-prone playlist recreation into Serato and Rekordbox",
            "Last-minute timeline changes causing missed song cues during rehearsals",
            "Juggling 4+ disconnected apps for quotes, contracts, and Stripe deposits",
        ],
        "features": [
            {
                "title": "Serato / Rekordbox Playlist Export",
                "desc": "Export approved guest requests and must-play lists directly into native DJ software crate files with one click.",
            },
            {
                "title": "Collaborative Event Timelines",
                "desc": "Real-time timeline builder shared between couples, planners, MCs, and lighting techs with instant sync.",
            },
            {
                "title": "Branded Guest Song Request Portal",
                "desc": "Give couples a personalized, mobile-friendly link where guests request and upvote songs ahead of time.",
            },
            {
                "title": "Instant Quotes & Automated E-Sign",
                "desc": "Send interactive proposals with packages, contracts, and deposit collection in a seamless 90-second flow.",
            },
        ],
        "entitlements": [
            "Unlimited DJ packages and custom add-ons",
            "Multi-crate Serato and Rekordbox XML exports",
            "Interactive client timeline & music planning forms",
            "Automatic deposit collection and payment reminders",
            "Mobile crew run sheets for assistant DJs and lighting techs",
        ],
        "keywords": ["mobile DJ booking software", "DJ contract app", "wedding DJ planning", "Serato playlist export"],
        "app_category": "EntertainmentApplication",
    },
    "rentals": {
        "name": "Inflatables & Party Rentals",
        "headline": "The Modern Alternative for Inflatable & Party Rentals",
        "summary": "Automated inventory conflict detection, route-aware dispatch, buffer times, damage tracking, and real-time weather risk alerts for bouncy house and event rental operators.",
        "meta_description": "Inflatable and bounce house rental software. Modern inventory management, automated weather risk alerts, crew dispatch, and online booking to replace Inflatable Office.",
        "pain_points": [
            "Overbooking inflatables due to manual spreadsheet and whiteboard tracking",
            "Unexpected high winds or rain causing frantic last-minute client calls and disputes",
            "Drivers showing up without blowers, stakes, or correct extension cords",
            "Hours spent calculating travel fees and delivery windows for weekend setups",
        ],
        "features": [
            {
                "title": "Automated Weather Risk Thresholds",
                "desc": "Continuous wind speed and rain forecast monitoring with automatic alerts and 1-click rain-date rebooking.",
            },
            {
                "title": "Buffer & Turnaround Automation",
                "desc": "Automated cleaning and setup buffer calculation to guarantee gear is never double-scheduled across tight windows.",
            },
            {
                "title": "Visual Load & Truck Planning",
                "desc": "Assign inflatables, generators, and stakes to specific delivery vehicles with digital load checklists.",
            },
            {
                "title": "Online Booking & Waiver E-Sign",
                "desc": "Customers choose bounce houses, select delivery windows, sign safety liability waivers, and pay deposits online.",
            },
        ],
        "entitlements": [
            "Real-time unit availability and buffer management",
            "Wind and rain threshold weather radar integration",
            "Digital delivery run sheets with GPS turn-by-turn",
            "Liability waiver capture and safety checklist confirmation",
            "Custom delivery fees by radius, zip code, or drive time",
        ],
        "keywords": ["bounce house rental software", "inflatable rental software", "party rental inventory management", "weather alert rental software"],
        "app_category": "BusinessApplication",
    },
    "photo-booths": {
        "name": "Photo Booth & 360 Video Teams",
        "headline": "Scale Your Photo Booth & 360 Video Business",
        "summary": "Asset utilization, attendant assignment, backdrop cataloging, template proofing approvals, and automated media delivery workflows for modern photo booth companies.",
        "meta_description": "Photo booth business software. Attendant dispatch, print template proofing, backdrop inventory, and instant online contract signing for modern 360 and photo booth teams.",
        "pain_points": [
            "Print template revisions lost in disorganized email back-and-forth",
            "Attendants arriving at venues without cords, props, or backup printers",
            "Backdrop double-bookings during peak graduation and holiday seasons",
            "Clients waiting days for contract updates and final balance receipts",
        ],
        "features": [
            {
                "title": "Client Template Proofing Hub",
                "desc": "Upload photo strip and 360 overlay designs for 1-click client approval with versioned comments.",
            },
            {
                "title": "Backdrop & Enclosure Inventory",
                "desc": "Track fabric backdrops, LED enclosures, and printer media stock with conflict prevention.",
            },
            {
                "title": "Attendant Mobile Run Sheets",
                "desc": "Give booth operators exact arrival times, venue load-in dock instructions, and on-site contact names.",
            },
            {
                "title": "Custom Add-On Upsells",
                "desc": "Offer audio guest books, glamour filters, magnetic frames, and extra hours right inside the booking flow.",
            },
        ],
        "entitlements": [
            "Digital template proofing and sign-off portal",
            "Attendant dispatch and equipment checklist sync",
            "Automated payment reminders and gratuity collection",
            "Branded white-label client experience",
            "Post-event review collection workflows",
        ],
        "keywords": ["photo booth management software", "360 photo booth booking app", "photo booth CRM", "photo booth template approval"],
        "app_category": "BusinessApplication",
    },
    "game-trucks": {
        "name": "Mobile Game Trucks & Arcades",
        "headline": "High-Efficiency Scheduling for Game Trucks & Laser Tag",
        "summary": "Vehicle fleet management, game coach crew scheduling, travel radius windows, power requirement checklists, and automated party confirmations for mobile entertainment fleets.",
        "meta_description": "Mobile game truck scheduling software. Vehicle route planning, game coach dispatch, travel fees, and online booking for mobile video game theaters and laser tag.",
        "pain_points": [
            "Scheduling parties too close together without factoring in drive time and traffic",
            "Arriving at birthday parties to discover inadequate parking or electrical hookups",
            "Game coaches forgetting game consoles, controllers, or laser tag sensors",
            "Missed birthday inquiries while out running weekend parties",
        ],
        "features": [
            {
                "title": "Smart Route & Travel Windows",
                "desc": "Automated drive-time calculation and zip code routing to ensure your trailers arrive on time every time.",
            },
            {
                "title": "Venue & Parking Questionnaires",
                "desc": "Collect street parking permissions, driveway incline notes, and power outlet locations before dispatch.",
            },
            {
                "title": "Game Coach Crew Dispatch",
                "desc": "Assign coaches to vehicles with pre-flight checklist verification directly on their mobile phones.",
            },
            {
                "title": "Instant Online Party Packages",
                "desc": "Let parents select gaming party packages, add laser tag or VR, and pay deposits 24/7 without phone calls.",
            },
        ],
        "entitlements": [
            "Multi-truck calendar dispatch with route clustering",
            "Automatic travel fee calculation by distance",
            "Pre-party site condition and power questionnaires",
            "Mobile coach run sheets with emergency client contacts",
            "Automated party preparation tips sent to parents",
        ],
        "keywords": ["game truck booking software", "mobile video game truck software", "laser tag scheduling app", "game truck route dispatch"],
        "app_category": "BusinessApplication",
    },
    "casino": {
        "name": "Casino & Nightlife Entertainment",
        "headline": "Flawless Coordination for Casino Nights & Trivia",
        "summary": "Dealer and talent scheduling, poker/blackjack table logistics, chips and tournament run sheets, corporate billing, and deposit flows tailored for themed live event operators.",
        "meta_description": "Casino party booking and dealer scheduling software. Manage blackjack/poker tables, dealer rosters, corporate contracts, and run sheets for casino night entertainment.",
        "pain_points": [
            "Scrambling to confirm 15+ independent dealers for Saturday night corporate galas",
            "Complex table inventory logistics (felt colors, roulette wheels, chip sets) tracked on paper",
            "Corporate clients requiring formal vendor paperwork, W-9s, and split invoices",
            "Dealers showing up without knowing table assignments or dress code requirements",
        ],
        "features": [
            {
                "title": "Talent & Dealer Rostering",
                "desc": "Broadcast available casino shifts to your dealer network and confirm shifts via SMS with 1 click.",
            },
            {
                "title": "Casino Table Inventory Logistics",
                "desc": "Track blackjack, craps, roulette, and poker tables with chips, cards, and accessory bundle requirements.",
            },
            {
                "title": "Corporate Invoicing & PO Workflows",
                "desc": "Support purchase orders, multi-milestone billing, net-30 terms, and corporate credit cards.",
            },
            {
                "title": "Master Event Run Sheets",
                "desc": "Provide event pit bosses with detailed timing, dealer shift rotations, and client VIP notes.",
            },
        ],
        "entitlements": [
            "Shift broadcast and confirmation for dealer rosters",
            "Multi-table bundle logistics and tracking",
            "Corporate invoicing with custom payment schedules",
            "Pit boss digital run sheet with shift rotation management",
            "Customizable insurance and liability contract clauses",
        ],
        "keywords": ["casino party booking software", "dealer scheduling app", "casino night entertainment CRM", "event talent management"],
        "app_category": "BusinessApplication",
    },
    "performers": {
        "name": "Live Performers & Character Talent",
        "headline": "Talent Booking Made Predictable and Professional",
        "summary": "Role skill matching, costume inventory tracking, audition reels, client communication, and automated payment disbursements for live talent agencies and performer troupes.",
        "meta_description": "Performer and character booking software. Role matching, performer availability, costume management, and contracts for magicians, bands, princesses, and live talent.",
        "pain_points": [
            "Double-booking specialized character performers (e.g. princess or superhero) on the same afternoon",
            "Costumes and specialized props returned damaged or missing pieces without accountability",
            "Performers not receiving venue parking instructions, child's name, or performance cues",
            "Managing manual payouts and commission splits across dozens of freelance performers",
        ],
        "features": [
            {
                "title": "Role & Skill Matching Roster",
                "desc": "Filter talent by vocal range, character role, specialty skill (e.g., stilt-walking, balloon art), and zip code.",
            },
            {
                "title": "Costume & Prop Asset Tracking",
                "desc": "Check out character suits, wigs, and props to talent with photo condition verification upon return.",
            },
            {
                "title": "Confidential Performer Briefs",
                "desc": "Share birthday child details, performance cues, and venue arrival rules without exposing client financial info.",
            },
            {
                "title": "Seamless Payout Calculations",
                "desc": "Automatically compute talent pay, travel stipends, and company margin per booking with zero spreadsheet math.",
            },
        ],
        "entitlements": [
            "Character and role taxonomy with skill tags",
            "Costume inventory checkout with condition photos",
            "Private talent portal with role briefs and maps",
            "Automated contract and liability protection",
            "Performer payout statements and financial reporting",
        ],
        "keywords": ["performer booking software", "character talent agency software", "entertainer scheduling app", "talent roster CRM"],
        "app_category": "EntertainmentApplication",
    },
}


def get_context(context):
    settings = get_marketing_settings()
    vertical = (frappe.form_dict.get("vertical") or "djs").strip().lower()

    if vertical not in SOLUTIONS:
        frappe.throw("Solution not found", frappe.DoesNotExistError)

    solution = SOLUTIONS[vertical]
    route = f"/solutions/{vertical}"
    title = f"{solution['name']} Software | Entertainment Express"
    meta_desc = solution["meta_description"]

    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Solutions", "url": "/solutions/djs"},
        {"label": solution["name"], "url": route},
    ]

    apply_common_page_context(
        context,
        settings,
        title,
        meta_desc,
        route,
        breadcrumbs=breadcrumbs,
    )

    base_domain = context.base_domain or "entx.app"
    site_url = f"https://www.{base_domain}"

    # SoftwareApplication JSON-LD scoped to vertical
    context.page_json_ld = build_software_app_jsonld(
        name=f"Entertainment Express for {solution['name']}",
        description=meta_desc,
        url=f"{site_url}{route}",
        category=solution.get("app_category", "BusinessApplication"),
    )

    context.vertical = vertical
    context.solution = solution
    context.solution_keys = list(SOLUTIONS.keys())
    context.all_solutions = SOLUTIONS
    context.no_cache = 1
