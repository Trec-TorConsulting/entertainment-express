import frappe
from entertainment_express.setup.documentation_seed import SEED_CATEGORIES, SEED_ARTICLES

# Lookup map for category and article metadata
SEED_CAT_MAP = {c["category_name"]: c for c in SEED_CATEGORIES}
SEED_ARTICLES_BY_TITLE = {a["title"].strip().lower(): a for a in SEED_ARTICLES}
SEED_ARTICLES_BY_ROUTE = {a["route"].strip().lower(): a for a in SEED_ARTICLES}

# Build category slug & name resolver
CATEGORY_SLUG_TO_NAME = {}
for c in SEED_CATEGORIES:
    name = c["category_name"]
    slug_route = c["route"].replace("docs/", "").strip("/").lower()
    CATEGORY_SLUG_TO_NAME[slug_route] = name
    CATEGORY_SLUG_TO_NAME[name.lower()] = name
    CATEGORY_SLUG_TO_NAME[frappe.utils.slug(name)] = name
    # Also index without punctuation
    CATEGORY_SLUG_TO_NAME[name.lower().replace("&", "and").replace(",", "")] = name

def _matches_category(article_category, requested_category):
    """Accurately matches category whether passed as slug, route, canonical name, or search query."""
    if not requested_category:
        return True
    req = requested_category.strip().lower()
    art = (article_category or "").strip().lower()
    
    # 1. Canonical lookup via dictionary
    canonical = CATEGORY_SLUG_TO_NAME.get(req)
    if canonical and canonical.lower() == art:
        return True
        
    # 2. Direct string equality
    if req == art:
        return True
        
    # 3. Normalized slug / name comparison (handles & vs and, dashes vs spaces)
    req_norm = req.replace("-", " ").replace("&", "and").replace(",", "").strip()
    art_norm = art.replace("-", " ").replace("&", "and").replace(",", "").strip()
    if req_norm == art_norm or req_norm in art_norm or art_norm in req_norm:
        return True
        
    return False

def _matches_role(article_role, requested_role):
    if not requested_role or requested_role.lower() in ("all", "all users", ""):
        return True
    req = requested_role.strip().lower()
    art = (article_role or "").strip().lower()
    if art in ("all users", "all"):
        return True
    # Aliases
    if req in ("owner", "admin", "owners & admins") and art in ("owner", "admin"):
        return True
    if req in ("crew", "employee", "djs", "field crew") and art in ("crew", "employee"):
        return True
    if req in ("client", "customer", "host") and art in ("client", "customer"):
        return True
    if req in ("developer", "api", "integrations") and art in ("developer", "api"):
        return True
    return req == art

@frappe.whitelist(allow_guest=True)
def search_documentation(query=None, role=None, category=None):
    """
    Whitelisted API to search help articles.
    Returns JSON array of matching documentation articles with role filtering.
    """
    query = (query or "").strip().lower()
    category = (category or "").strip().lower()
    matched_articles = []
    seen_titles = set()

    # 1. First process DB records if present
    try:
        if frappe.db.exists("DocType", "Help Article"):
            filters = {"published": 1}
            db_articles = frappe.get_all(
                "Help Article",
                filters=filters,
                fields=["title", "category", "route", "content"]
            )
            for doc in db_articles:
                t = (doc.get("title") or "").strip()
                t_key = t.lower()
                cat = doc.get("category") or ""
                
                # Enrich with seed metadata
                meta = SEED_ARTICLES_BY_TITLE.get(t_key) or {}
                art_role = meta.get("role", "All Users")
                summary = meta.get("summary") or doc.get("content", "")[:160]
                read_time = meta.get("read_time", "4 min read")
                level = meta.get("level", "Beginner")

                # Filter by Role
                if role and not _matches_role(art_role, role):
                    continue

                # Filter by Category
                if category and not _matches_category(cat, category):
                    continue

                # Filter by Keyword Query
                content = doc.get("content") or ""
                if query and (query not in t_key and query not in content.lower() and query not in summary.lower()):
                    continue

                matched_articles.append({
                    "title": t,
                    "category": cat,
                    "route": doc.get("route") or f"docs/{frappe.utils.slug(t)}",
                    "role": art_role,
                    "level": level,
                    "read_time": read_time,
                    "summary": summary
                })
                seen_titles.add(t_key)
    except Exception as e:
        frappe.logger("entertainment_express").warning(f"Error reading Help Article DB: {e}")

    # 2. Add or supplement from SEED_ARTICLES
    for sa in SEED_ARTICLES:
        t = sa["title"].strip()
        t_key = t.lower()
        if t_key in seen_titles:
            continue

        art_role = sa.get("role", "All Users")
        if role and not _matches_role(art_role, role):
            continue

        cat = sa.get("category", "")
        if category and not _matches_category(cat, category):
            continue

        content = sa.get("content", "")
        summary = sa.get("summary", "")
        if query and (query not in t_key and query not in content.lower() and query not in summary.lower()):
            continue

        matched_articles.append({
            "title": t,
            "category": cat,
            "route": f"docs/{sa['route']}",
            "role": art_role,
            "level": sa.get("level", "Beginner"),
            "read_time": sa.get("read_time", "4 min read"),
            "summary": summary
        })
        seen_titles.add(t_key)

    return {
        "query": query,
        "role": role,
        "category": category,
        "results_count": len(matched_articles),
        "results": matched_articles
    }

@frappe.whitelist(allow_guest=True)
def get_documentation_categories(role=None):
    """Returns all documentation categories with article counts matching the requested role."""
    categories = []
    
    # Calculate counts from seed articles filtered by role
    for cat in SEED_CATEGORIES:
        cat_name = cat["category_name"]
        matching_count = sum(
            1 for a in SEED_ARTICLES
            if a["category"] == cat_name and _matches_role(a.get("role"), role)
        )
        categories.append({
            "category_name": cat_name,
            "description": cat["description"],
            "route": f"docs/{cat['route']}",
            "article_count": matching_count,
            "icon": cat.get("icon", "book")
        })

    return categories
