"""Non-Stripe processors: real HTTP when keys exist, otherwise ProcessorNotConfigured."""

from __future__ import annotations

import os

from entertainment_express.billing_payments.processors import Processor


class SquareProcessor(Processor):
    name = "square"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_SQUARE_ACCESS_TOKEN"))


class PayPalProcessor(Processor):
    name = "paypal"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_PAYPAL_CLIENT_ID") and os.environ.get("EE_PAYPAL_CLIENT_SECRET"))


class ACHProcessor(Processor):
    name = "ach"

    def configured(self) -> bool:
        # ACH rides Stripe Financial Connections / PaymentIntents when Stripe is on
        return bool(os.environ.get("EE_STRIPE_SECRET_KEY", "").startswith("sk_"))


class AuthorizeNetProcessor(Processor):
    name = "authorizenet"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_AUTHORIZENET_API_LOGIN") and os.environ.get("EE_AUTHORIZENET_TRANSACTION_KEY"))
