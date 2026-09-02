"""Phase 3 HR custom fields (payout account) plus JSON DocTypes."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
