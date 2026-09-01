"""Apply Phase 9 Field PWA DocTypes and issue template."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
    from entertainment_express.api.field import _ensure_templates

    _ensure_templates()
