import frappe

from entertainment_express.marketing.site_context import get_marketing_settings, get_sitemap_routes


def get_context(context):
    settings = get_marketing_settings()
    base_domain = settings.get("base_domain") or "entx.app"
    routes = get_sitemap_routes()

    urls = []
    for r in routes:
        priority = "1.0" if r == "/" else ("0.9" if r in ("/pricing", "/features") else "0.8")
        changefreq = "weekly" if r in ("/", "/pricing", "/features") else "monthly"
        urls.append({
            "loc": f"https://www.{base_domain}{r}",
            "priority": priority,
            "changefreq": changefreq,
        })

    context.urls = urls
    context.no_cache = 1
