import frappe

from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


SOLUTIONS = {
    "djs": {
        "name": "Mobile DJs and MCs",
        "summary": "Package management, planning forms, timelines, and gear/crew assignment for event entertainment.",
    },
    "rentals": {
        "name": "Inflatables and Party Rentals",
        "summary": "Inventory-backed booking, route-aware dispatch, setup buffers, and damage tracking.",
    },
    "photo-booths": {
        "name": "Photo Booth and 360 Teams",
        "summary": "Booth utilization, attendant scheduling, and media delivery workflows in one system.",
    },
    "game-trucks": {
        "name": "Game Trucks and VR",
        "summary": "Vehicle + crew capacity planning, travel windows, and on-site execution checklists.",
    },
    "casino": {
        "name": "Casino / Karaoke / Trivia",
        "summary": "Talent assignment, event run sheets, and contract/deposit flows tailored for themed events.",
    },
    "performers": {
        "name": "Performers and Character Talent",
        "summary": "Role skill matching, availability checks, and client communication for live talent bookings.",
    },
}


def get_context(context):
    settings = get_marketing_settings()
    vertical = (frappe.form_dict.get("vertical") or "djs").strip().lower()
    if vertical not in SOLUTIONS:
        frappe.throw("Solution not found", frappe.DoesNotExistError)

    solution = SOLUTIONS[vertical]
    apply_common_page_context(
        context,
        settings,
        f"{solution['name']} | Entertainment Express",
        solution["summary"],
        f"/solutions/{vertical}",
    )
    context.vertical = vertical
    context.solution = solution
    context.solution_keys = list(SOLUTIONS.keys())
    context.no_cache = 1
