"""Apply Phase 11 AI settings, lead score, and reply template."""


def execute():
    from entertainment_express.setup.install import create_all
    from entertainment_express.setup.seed_plans import _ensure_ai_entitlements
    from entertainment_express.api.ai import _ensure_templates

    create_all()
    _ensure_ai_entitlements()
    _ensure_templates()
