"""Apply Phase 18 import/export tables (DocTypes sync via migrate)."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
