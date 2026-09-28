import frappe
from entertainment_express.setup.documentation_seed import SEED_ARTICLES, SEED_CATEGORIES

def get_context(context):
    context.no_cache = 1
    
    # Extract path / route from form_dict or request
    route = frappe.form_dict.get("article_slug") or frappe.form_dict.get("route")
    
    article = None
    
    # 1. Query Help Article DocType first if present
    if frappe.db.exists("DocType", "Help Article") and route:
        matched = frappe.get_all(
            "Help Article",
            filters={"published": 1},
            fields=["name", "title", "category", "content", "level", "route", "likes"]
        )
        for doc in matched:
            if route in (doc.get("route") or "") or route in (doc.get("name") or "") or route in (doc.get("title") or "").lower().replace(" ", "-"):
                article = doc
                break

    # 2. Fallback to SEED_ARTICLES match
    if not article and route:
        clean_route = route.replace("docs/", "")
        for sa in SEED_ARTICLES:
            if sa["route"] == clean_route or sa["route"] in route or clean_route in sa["route"]:
                article = {
                    "title": sa["title"],
                    "category": sa["category"],
                    "content": sa["content"],
                    "level": sa.get("level", "Beginner"),
                    "role": sa.get("role", "All Users"),
                    "likes": 12
                }
                break

    # 3. Default fallback article if none matched
    if not article:
        sa = SEED_ARTICLES[0]
        article = {
            "title": sa["title"],
            "category": sa["category"],
            "content": sa["content"],
            "level": sa.get("level", "Beginner"),
            "role": sa.get("role", "All Users"),
            "likes": 12
        }

    context.title = f"{article['title']} — Entertainment Express Documentation"
    context.article = article
    
    # Related articles in same category
    context.related_articles = [
        {
            "title": a["title"],
            "route": f"/docs/{a['route']}",
            "level": a.get("level", "Beginner")
        }
        for a in SEED_ARTICLES if a["category"] == article["category"] and a["title"] != article["title"]
    ][:4]

    return context
