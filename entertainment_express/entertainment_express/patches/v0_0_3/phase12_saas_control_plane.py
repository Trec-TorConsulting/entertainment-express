"""Apply Phase 12 plan billing fields."""


def execute():
    from entertainment_express.setup.seed_plans import _ensure_ai_entitlements, _ensure_billing_fields

    _ensure_ai_entitlements()
    _ensure_billing_fields()
