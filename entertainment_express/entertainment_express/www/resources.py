import frappe

from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Resources | Entertainment Express",
        "Guides and articles for growing entertainment operations teams.",
        "/resources",
    )

    posts = []
    if frappe.db.exists("DocType", "Blog Post"):
        posts = frappe.get_all(
            "Blog Post",
            filters={"published": 1},
            fields=["name", "title", "blog_intro", "route", "published_on"],
            order_by="published_on desc",
            limit_page_length=12,
        )

    categories = []
    if frappe.db.exists("DocType", "Blog Category"):
        categories = frappe.get_all("Blog Category", fields=["title", "route"], order_by="title asc")

    context.posts = posts
    context.categories = categories
    context.rss_url = "/blog?format=rss"
