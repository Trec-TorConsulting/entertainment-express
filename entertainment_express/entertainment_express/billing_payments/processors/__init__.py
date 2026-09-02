"""Payment processor plugins. Unconfigured processors never silently succeed."""

from __future__ import annotations

from dataclasses import dataclass


class ProcessorNotConfigured(Exception):
    pass


class ProcessorError(Exception):
    pass


@dataclass
class ChargeResult:
    processor_txn_id: str
    status: str
    raw: dict


class Processor:
    name = "base"

    def configured(self) -> bool:
        return False

    def _require(self):
        if not self.configured():
            raise ProcessorNotConfigured(
                f"{self.name} is not connected. Add credentials in the cluster secret "
                f"or choose Stripe."
            )

    def charge(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        self._require()
        raise ProcessorError("charge not implemented")

    def hosted_checkout(self, amount_cents: int, currency: str, **kwargs) -> dict:
        self._require()
        raise ProcessorError("hosted checkout not implemented")

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        self._require()
        raise ProcessorError("refund not implemented")

    def preauth(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        self._require()
        raise ProcessorError("preauth not implemented")

    def capture(self, processor_txn_id: str, amount_cents: int | None = None) -> ChargeResult:
        self._require()
        raise ProcessorError("capture not implemented")

    def release(self, processor_txn_id: str) -> ChargeResult:
        self._require()
        raise ProcessorError("release not implemented")


def get_processor(name: str = "stripe") -> Processor:
    name = (name or "stripe").lower()
    from entertainment_express.billing_payments.processors.stripe_processor import StripeProcessor
    from entertainment_express.billing_payments.processors.plugins import (
        ACHProcessor,
        AuthorizeNetProcessor,
        PayPalProcessor,
        SquareProcessor,
    )

    mapping = {
        "stripe": StripeProcessor,
        "square": SquareProcessor,
        "paypal": PayPalProcessor,
        "ach": ACHProcessor,
        "authorizenet": AuthorizeNetProcessor,
    }
    cls = mapping.get(name)
    if not cls:
        raise ProcessorNotConfigured(f"Unknown processor '{name}'.")
    return cls()
