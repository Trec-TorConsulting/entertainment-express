import frappe
from entertainment_express.api.docs import get_documentation_categories, search_documentation
from entertainment_express.setup.documentation_seed import SEED_ARTICLES

def get_context(context):
    context.no_cache = 1
    context.title = "User Documentation & Help Center — Entertainment Express"
    context.meta_description = "Comprehensive user guides, workflows, field crew playbooks, client help, and API reference for Entertainment Express."
    
    # Categories & Featured Articles
    context.categories = get_documentation_categories()
    
    query = frappe.form_dict.get("q") or frappe.form_dict.get("query")
    role_filter = frappe.form_dict.get("role")
    
    if query or role_filter:
        res = search_documentation(query=query, role=role_filter)
        context.search_query = query
        context.search_results = res["results"]
    else:
        context.search_query = ""
        context.search_results = None

    context.featured_articles = [
        {
            "title": art["title"],
            "category": art["category"],
            "route": f"/docs/{art['route']}",
            "role": art.get("role", "All Users"),
            "level": art.get("level", "Beginner"),
            "snippet": art["content"][:140].replace("<h2>", "").replace("</h2>", "").replace("<p>", "").replace("</p>", "") + "..."
        }
        for art in SEED_ARTICLES[:6]
    ]

    return context
