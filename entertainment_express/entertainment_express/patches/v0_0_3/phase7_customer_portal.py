"""Apply Phase 7 deliverable and booking-change tables."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
