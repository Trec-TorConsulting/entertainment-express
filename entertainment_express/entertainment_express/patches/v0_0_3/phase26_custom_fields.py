"""Apply Phase 26 custom fields on ERPNext DocTypes (Quotation, Quotation Item)."""


def execute():
    from entertainment_express.setup.install import create_all

    create_all()
