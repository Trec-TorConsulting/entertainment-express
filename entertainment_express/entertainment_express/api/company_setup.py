"""
Company Studio & Curated Settings API for /owner portal.
Allows business owners to manage company details, tax templates, and chart of accounts mapping
without requiring access to Frappe Desk (/app).
"""

import json
import frappe
from frappe.utils import flt, now_datetime


def _assert_owner_access():
    """Verify that calling user has owner or system manager permissions."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(frappe.session.user))
    if not ({"EE Tenant Admin", "System Manager"} & roles):
        frappe.throw("Only business owners can modify company studio settings.", frappe.PermissionError)


def _get_default_company():
    return (
        frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
        or frappe.db.get_value("Company", {}, "name")
        or "Premier Events LLC"
    )


@frappe.whitelist()
def get_company_settings() -> dict:
    """Retrieve primary company profile, currency, and fiscal settings."""
    _assert_owner_access()
    company_name = _get_default_company()
    company = frappe.get_doc("Company", company_name)
    
    return {
        "company_name": company.name,
        "default_currency": company.default_currency or "USD",
        "country": company.country or "United States",
        "tax_id": company.get("tax_id") or "",
        "phone_no": company.get("phone_no") or "",
        "email": company.get("email") or "",
        "website": company.get("website") or "",
        "date_of_establishment": str(company.get("date_of_establishment") or ""),
        "default_receivable_account": company.default_receivable_account or "",
        "default_bank_account": company.default_bank_account or "",
        "default_cash_account": company.default_cash_account or "",
        "default_income_account": company.default_income_account or "",
        "default_expense_account": company.default_expense_account or ""
    }


@frappe.whitelist()
def save_company_settings(data: str) -> dict:
    """Update primary company profile and defaults."""
    _assert_owner_access()
    payload = json.loads(data) if isinstance(data, str) else data
    company_name = payload.get("company_name") or _get_default_company()
    
    if not frappe.db.exists("Company", company_name):
        frappe.throw(f"Company {company_name} not found.", frappe.DoesNotExistError)
        
    company = frappe.get_doc("Company", company_name)
    
    allowed_fields = [
        "default_currency", "country", "tax_id", "phone_no", "email",
        "website", "date_of_establishment", "default_receivable_account",
        "default_bank_account", "default_cash_account",
        "default_income_account", "default_expense_account"
    ]
    
    for field in allowed_fields:
        if field in payload:
            setattr(company, field, payload[field])
            
    company.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": "Company settings updated successfully."}


@frappe.whitelist()
def get_tax_templates() -> list:
    """List sales tax templates and rules configured for the tenant."""
    _assert_owner_access()
    company = _get_default_company()
    
    templates = frappe.get_all(
        "Sales Taxes and Charges Template",
        filters={"company": company} if frappe.db.has_column("Sales Taxes and Charges Template", "company") else {},
        fields=["name", "title", "is_default", "disabled"] if frappe.db.has_column("Sales Taxes and Charges Template", "disabled") else ["name", "title", "is_default"]
    )
    
    results = []
    for t in templates:
        doc = frappe.get_doc("Sales Taxes and Charges Template", t.name)
        tax_rate = 0.0
        account_head = ""
        if hasattr(doc, "taxes") and doc.taxes:
            tax_rate = flt(doc.taxes[0].rate)
            account_head = doc.taxes[0].account_head
        results.append({
            "name": doc.name,
            "title": doc.title,
            "is_default": bool(doc.is_default),
            "rate": tax_rate,
            "account_head": account_head
        })
    return results


@frappe.whitelist()
def save_tax_rule(title: str, rate: float, is_default: int = 0, account_head: str = None) -> dict:
    """Create or update a Sales Taxes and Charges Template."""
    _assert_owner_access()
    company = _get_default_company()
    rate_flt = flt(rate)
    
    if not account_head:
        # Find or use tax liability account
        account_head = f"Sales Tax - {company}"
        if not frappe.db.exists("Account", account_head):
            accts = frappe.get_all("Account", filters={"company": company, "account_type": "Tax"}, fields=["name"])
            if accts:
                account_head = accts[0].name
                
    existing = frappe.db.exists("Sales Taxes and Charges Template", {"title": title, "company": company})
    if existing:
        doc = frappe.get_doc("Sales Taxes and Charges Template", existing)
    else:
        doc = frappe.new_doc("Sales Taxes and Charges Template")
        doc.title = title
        doc.company = company
        
    doc.is_default = int(is_default)
    doc.taxes = []
    doc.append("taxes", {
        "charge_type": "On Net Total",
        "account_head": account_head,
        "rate": rate_flt,
        "description": f"{title} ({rate_flt}%)"
    })
    
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "template_name": doc.name, "rate": rate_flt}


@frappe.whitelist()
def get_chart_of_accounts_mapping() -> dict:
    """Get active Chart of Accounts mappings for core event revenue, costs, and liabilities."""
    _assert_owner_access()
    company = _get_default_company()
    company_doc = frappe.get_doc("Company", company)
    
    # Also fetch tip liability and merchant fee accounts if custom fields exist
    tip_account = getattr(company_doc, "ee_tip_liability_account", "") or ""
    merchant_fee_account = getattr(company_doc, "ee_merchant_fee_account", "") or ""
    
    accounts = frappe.get_all(
        "Account",
        filters={"company": company, "is_group": 0},
        fields=["name", "account_name", "account_type", "root_type"],
        order_by="name asc"
    )
    
    return {
        "company": company,
        "mappings": {
            "default_income_account": company_doc.default_income_account or "",
            "default_expense_account": company_doc.default_expense_account or "",
            "default_receivable_account": company_doc.default_receivable_account or "",
            "default_bank_account": company_doc.default_bank_account or "",
            "default_cash_account": company_doc.default_cash_account or "",
            "tip_liability_account": tip_account,
            "merchant_fee_account": merchant_fee_account
        },
        "available_accounts": accounts
    }


@frappe.whitelist()
def save_chart_of_accounts_mapping(mappings: str) -> dict:
    """Save updated default accounts on Company."""
    _assert_owner_access()
    company = _get_default_company()
    company_doc = frappe.get_doc("Company", company)
    
    payload = json.loads(mappings) if isinstance(mappings, str) else mappings
    
    for key, val in payload.items():
        if hasattr(company_doc, key):
            setattr(company_doc, key, val or None)
            
    company_doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "success", "message": "Chart of Accounts mapping updated successfully."}
