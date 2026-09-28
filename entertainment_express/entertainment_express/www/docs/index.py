import frappe
from entertainment_express.api.docs import get_documentation_categories, search_documentation

def get_context(context):
    context.no_cache = 1
    
    role = (frappe.form_dict.get("role") or "").strip()
    category = (frappe.form_dict.get("category") or "").strip()
    query = (frappe.form_dict.get("q") or frappe.form_dict.get("query") or "").strip()

    # Normalize role
    role_lower = role.lower()
    if role_lower in ("owner", "admin", "owners"):
        role = "Owner"
    elif role_lower in ("crew", "employee", "djs", "field"):
        role = "Crew"
    elif role_lower in ("client", "customer", "host"):
        role = "Client"
    elif role_lower in ("developer", "api"):
        role = "Developer"
    else:
        role = ""

    # Dynamic role headlines
    if role == "Owner":
        context.title = "Owner Operations & Business Cockpit Docs — Entertainment Express"
        context.role_headline = "🏢 Owner Operations & Business Cockpit"
        context.role_description = "Step-by-step guides for entertainment business owners to set up pricing, equipment inventory, dispatch, job costing, and payroll."
    elif role == "Crew":
        context.title = "Field Crew, DJs & Talent Playbooks — Entertainment Express"
        context.role_headline = "🎧 Field Crew, DJs & Talent Playbook"
        context.role_description = "Phone-first field guides for DJs, drivers, and attendants to navigate venues, scan truck gear, and run on-site events."
    elif role == "Client":
        context.title = "Client & Event Host Guides — Entertainment Express"
        context.role_headline = "🎉 Client & Event Host Guides"
        context.role_description = "Everything party hosts, brides, and corporate planners need to review proposals, sign contracts, pay deposits, and choose songs."
    elif role == "Developer":
        context.title = "APIs, Hardware & Webhook Integrations — Entertainment Express"
        context.role_headline = "⚡ APIs, Hardware & Webhook Integrations"
        context.role_description = "Technical references for REST endpoints, webhooks, calendar synchronization, and DJ software playlist exports."
    else:
        context.title = "User Documentation & Help Center — Entertainment Express"
        context.role_headline = "Documentation & Knowledge Base"
        context.role_description = "Simple, step-by-step guides designed for company owners, field crew, clients, and technical teams."

    context.selected_role = role
    context.selected_category = category
    context.search_query = query
    context.categories = get_documentation_categories(role=role)

    # Search / fetch articles
    res = search_documentation(query=query, role=role, category=category)
    context.articles_list = res["results"]
    context.results_count = res["results_count"]

    return context
