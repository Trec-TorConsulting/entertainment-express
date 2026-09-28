import frappe
from entertainment_express.setup.documentation_seed import SEED_CATEGORIES, SEED_ARTICLES

@frappe.whitelist(allow_guest=True)
def search_documentation(query=None, role=None, category=None):
    """
    Whitelisted API to search help articles.
    Returns JSON array of matching documentation articles.
    """
    query = (query or "").strip().lower()
    
    # 1. Try querying Frappe DB first if DocType exists
    articles = []
    if frappe.db.exists("DocType", "Help Article"):
        filters = {"published": 1}
        if category:
            filters["category"] = category
            
        db_articles = frappe.get_all(
            "Help Article",
            filters=filters,
            fields=["title", "category", "route", "level", "content"]
        )
        for art in db_articles:
            title = art.get("title") or ""
            content = art.get("content") or ""
            # Simple keyword matching
            if not query or query in title.lower() or query in content.lower():
                articles.append({
                    "title": title,
                    "category": art.get("category"),
                    "route": art.get("route") or f"docs/{frappe.utils.slug(title)}",
                    "level": art.get("level", "Beginner"),
                    "snippet": (content[:160] + "...") if len(content) > 160 else content
                })

    # 2. Fallback to SEED_ARTICLES if DB returns no results or is unavailable
    if not articles:
        for art in SEED_ARTICLES:
            if role and role.lower() != "all users" and art.get("role", "").lower() not in [role.lower(), "all users"]:
                continue
            if category and art.get("category", "").lower() != category.lower():
                continue
                
            title = art["title"]
            content = art["content"]
            if not query or query in title.lower() or query in content.lower():
                articles.append({
                    "title": title,
                    "category": art["category"],
                    "route": f"docs/{art['route']}",
                    "level": art.get("level", "Beginner"),
                    "snippet": content[:160].replace("<h2>", "").replace("</h2>", "").replace("<p>", "").replace("</p>", "") + "..."
                })

    return {
        "query": query,
        "results_count": len(articles),
        "results": articles
    }

@frappe.whitelist(allow_guest=True)
def get_documentation_categories():
    """Returns all documentation categories with article counts."""
    categories = []
    if frappe.db.exists("DocType", "Help Category"):
        db_cats = frappe.get_all("Help Category", filters={"published": 1}, fields=["category_name", "description", "route"])
        for c in db_cats:
            count = frappe.db.count("Help Article", filters={"category": c["category_name"], "published": 1})
            categories.append({
                "category_name": c["category_name"],
                "description": c.get("description", ""),
                "route": c.get("route") or f"docs/{frappe.utils.slug(c['category_name'])}",
                "article_count": count
            })

    if not categories:
        for cat in SEED_CATEGORIES:
            count = sum(1 for a in SEED_ARTICLES if a["category"] == cat["category_name"])
            categories.append({
                "category_name": cat["category_name"],
                "description": cat["description"],
                "route": f"docs/{cat['route']}",
                "article_count": count,
                "icon": cat.get("icon", "book")
            })

    return categories
