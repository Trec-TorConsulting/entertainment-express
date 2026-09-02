"""Apply Phase 8 marketing DocTypes and campaign templates."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
    from entertainment_express.api.engagement import _ensure_templates

    _ensure_templates()
