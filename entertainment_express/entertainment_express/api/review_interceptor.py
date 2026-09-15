"""AI Review Interceptor & Reputation Catalyst for Entertainment Express.

Analyzes post-event customer sentiment, routes 5-star experiences to Google/Yelp
with smart SEO keyword suggestions, and intercepts negative feedback before public
posting by alerting the owner and drafting an immediate resolution with a credit voucher.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from types import SimpleNamespace

import frappe
from frappe.utils import flt, nowdate, now_datetime

from entertainment_express.ai.llm import complete


OWNER_MARKETING_ROLES = {"EE Tenant Admin", "EE Manager", "EE Marketing", "System Manager"}


def _get_user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _assert_marketing_access() -> None:
    user = _get_user()
    if not user or user in ("Guest", "guest"):
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(user) if hasattr(frappe, "get_roles") else [])
    if not (OWNER_MARKETING_ROLES & roles):
        frappe.throw("Insufficient permissions to access reputation management.", frappe.PermissionError)


def _get_default_company() -> str:
    if hasattr(frappe, "defaults") and hasattr(frappe.defaults, "get_user_default"):
        comp = frappe.defaults.get_user_default("Company")
        if comp:
            return comp
    return frappe.db.get_single_value("Global Defaults", "default_company") if hasattr(frappe.db, "get_single_value") else "Premier Events LLC"


@frappe.whitelist()
def analyze_feedback_sentiment(feedback_text: str, rating: int = None) -> dict:
    """Classify post-event client sentiment as Positive, Neutral, or Negative."""
    _assert_marketing_access()
    text = (feedback_text or "").strip()
    rating = int(rating) if rating is not None else None
    
    # Fast path if rating is explicitly provided
    if rating is not None:
        if rating >= 4:
            sentiment = "Positive"
            score = 0.9
        elif rating == 3:
            sentiment = "Neutral"
            score = 0.5
        else:
            sentiment = "Negative"
            score = 0.1
        return {"sentiment": sentiment, "score": score, "rating": rating}

    # Text sentiment analysis
    lower = text.lower()
    negative_words = ["disappointed", "late", "terrible", "bad", "awful", "horrible", "volume", "loud", "unprofessional", "missed", "ruined", "refund"]
    positive_words = ["amazing", "fantastic", "loved", "great", "best", "awesome", "incredible", "unbelievable", "packed", "wonderful", "perfect"]
    
    neg_count = sum(1 for w in negative_words if w in lower)
    pos_count = sum(1 for w in positive_words if w in lower)
    
    if neg_count > pos_count or neg_count >= 2:
        sentiment = "Negative"
        score = 0.2
        inferred_rating = 1 if neg_count >= 3 else 2
    elif pos_count > neg_count:
        sentiment = "Positive"
        score = 0.9
        inferred_rating = 5
    else:
        sentiment = "Neutral"
        score = 0.5
        inferred_rating = 3

    return {
        "sentiment": sentiment,
        "score": score,
        "rating": inferred_rating,
        "summary": f"Detected {sentiment.lower()} sentiment from customer feedback."
    }


@frappe.whitelist()
def process_client_feedback(
    booking_id: str,
    feedback_text: str,
    rating: int = None,
    client_phone: str = "+15551234567",
    client_email: str = "client@example.com"
) -> dict:
    """Route ecstatic clients to Google/Yelp or intercept negative feedback with owner escalation."""
    user = _get_user()
    company = _get_default_company()
    analysis = analyze_feedback_sentiment(feedback_text, rating)
    sentiment = analysis["sentiment"]
    
    google_review_url = "https://g.page/r/premier-events/review"
    yelp_review_url = "https://www.yelp.com/biz/premier-events-austin"

    if sentiment == "Positive":
        # 5-Star Reputation Catalyst: Generate SMS prompt with keyword suggestions
        suggested_keywords = ["packed dance floor", "seamless announcements", "best wedding DJ", "top entertainment company"]
        promoter_sms = (
            f"Thank you so much for having {company} at your celebration! "
            f"Would you mind taking 30 seconds to share your experience on Google? "
            f"Here is a direct link: {google_review_url} — It means the world to our team!"
        )
        
        action_result = {
            "action": "promoted_public_review",
            "suppressed_public_link": False,
            "google_review_url": google_review_url,
            "yelp_review_url": yelp_review_url,
            "suggested_keywords": suggested_keywords,
            "promoter_sms": promoter_sms,
            "message": "Positive review promoter dispatched to happy client."
        }
    else:
        # Review Interceptor: Suppress public links, flag owner alert, draft apology & voucher
        voucher_code = f"LOYALTY-CARE-{int(datetime.now().timestamp())}"
        voucher_amount = 100.0 if sentiment == "Negative" else 50.0
        
        resolution_draft = (
            f"Dear Client,\n\n"
            f"Thank you for your candid feedback regarding your recent event. At {company}, we hold our service "
            "to the highest standards, and we are sincerely sorry that we fell short of your expectations.\n\n"
            f"As a gesture of goodwill, we have issued a ${voucher_amount:,.2f} credit voucher (Code: {voucher_code}) "
            "for any future services. Our operations owner will also follow up personally to discuss how we can make this right.\n\n"
            f"Warm regards,\nOwner Team, {company}"
        )
        
        # High-priority audit alert
        if hasattr(frappe, "get_doc"):
            try:
                audit = frappe.get_doc({
                    "doctype": "EE Audit Log",
                    "action": "Review: Negative Feedback Intercepted",
                    "actor": "AI Review Interceptor",
                    "related_doctype": "Event Booking",
                    "related_name": booking_id,
                    "detail": f"CRITICAL: Unhappy client feedback intercepted for {booking_id}. Rating: {analysis['rating']}★. Feedback: '{feedback_text}'. Voucher: {voucher_code} (${voucher_amount:,.2f})"
                })
                if hasattr(audit, "insert"):
                    audit.insert(ignore_permissions=True)
            except Exception:
                pass

        action_result = {
            "action": "intercepted_internal_escalation",
            "suppressed_public_link": True,
            "critical_owner_alert": True,
            "voucher_code": voucher_code,
            "voucher_amount": voucher_amount,
            "apology_draft": resolution_draft,
            "message": "Sub-par feedback intercepted! Public review link suppressed. Owner alert triggered."
        }

    return {
        "status": "success",
        "booking_id": booking_id,
        "sentiment": sentiment,
        "rating": analysis["rating"],
        **action_result
    }
