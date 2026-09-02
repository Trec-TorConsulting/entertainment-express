"""Apply Phase 13 invoice custom field (Integration DocTypes come from JSON)."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
