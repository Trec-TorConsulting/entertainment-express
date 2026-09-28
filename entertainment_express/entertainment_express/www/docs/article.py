import frappe
from entertainment_express.setup.documentation_seed import (
    SEED_ARTICLES,
    SEED_CATEGORIES,
)
from entertainment_express.api.docs import (
    SEED_ARTICLES_BY_ROUTE,
    SEED_ARTICLES_BY_TITLE,
)

def get_context(context):
    context.no_cache = 1
    
    route = (frappe.form_dict.get("article_slug") or frappe.form_dict.get("route") or "").strip().lower()
    clean_route = route.replace("docs/", "").strip("/")
    
    article = None
    
    # 1. First look up directly in SEED_ARTICLES_BY_ROUTE for full rich metadata
    if clean_route in SEED_ARTICLES_BY_ROUTE:
        article = dict(SEED_ARTICLES_BY_ROUTE[clean_route])

    # 2. Try querying Frappe DB
    if not article and frappe.db.exists("DocType", "Help Article"):
        try:
            matched = frappe.get_all(
                "Help Article",
                filters={"published": 1},
                fields=["name", "title", "category", "content", "route"]
            )
            for doc in matched:
                doc_route = (doc.get("route") or "").lower().replace("docs/", "").strip("/")
                doc_title = (doc.get("title") or "").strip().lower()
                doc_name = (doc.get("name") or "").lower()
                if clean_route in (doc_route, doc_name) or clean_route in doc_title.replace(" ", "-"):
                    meta = SEED_ARTICLES_BY_TITLE.get(doc_title) or {}
                    article = {
                        "title": doc.get("title"),
                        "category": doc.get("category"),
                        "content": meta.get("content") or doc.get("content"),
                        "role": meta.get("role", "All Users"),
                        "level": meta.get("level", "Beginner"),
                        "read_time": meta.get("read_time", "4 min read"),
                        "summary": meta.get("summary", ""),
                        "route": doc.get("route")
                    }
                    break
        except Exception as e:
            frappe.logger("entertainment_express").warning(f"Error querying article: {e}")

    # 3. Partial route fallback match
    if not article and clean_route:
        for sa in SEED_ARTICLES:
            if clean_route in sa["route"] or sa["route"] in clean_route:
                article = dict(sa)
                break

    # 4. Final fallback
    if not article:
        article = dict(SEED_ARTICLES[0])

    context.title = f"{article['title']} — Entertainment Express Docs"
    context.article = article

    # Determine back link
    role = article.get("role", "")
    if role in ("Owner", "Crew", "Client", "Developer"):
        context.back_url = f"/docs?role={role}"
        context.back_label = f"← Back to {role} Playbooks"
    else:
        context.back_url = "/docs"
        context.back_label = "← Back to All Guides"

    # Related guides in same category
    cat = article.get("category")
    context.related_articles = [
        {
            "title": a["title"],
            "route": f"/docs/{a['route']}",
            "read_time": a.get("read_time", "4 min read")
        }
        for a in SEED_ARTICLES
        if a.get("category") == cat and a["title"] != article["title"]
    ][:6]

    return context
