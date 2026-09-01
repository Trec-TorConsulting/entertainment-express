"""Apply Phase 10 report schedules and digest template."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
    from entertainment_express.api.portal_reports import _ensure_templates

    _ensure_templates()
