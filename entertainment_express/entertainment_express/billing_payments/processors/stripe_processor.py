"""Stripe processor — live charges via the official SDK / secret key."""

from __future__ import annotations

import os

from entertainment_express.billing_payments.processors import ChargeResult, Processor


class StripeProcessor(Processor):
    name = "stripe"

    def configured(self) -> bool:
        key = os.environ.get("EE_STRIPE_SECRET_KEY") or ""
        return key.startswith("sk_")

    def _client(self):
        self._require()
        import stripe

        stripe.api_key = os.environ["EE_STRIPE_SECRET_KEY"]
        return stripe

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        stripe = self._client()
        ref = stripe.Refund.create(
            payment_intent=processor_txn_id,
            amount=amount_cents,
            reason="requested_by_customer" if reason else None,
        )
        return ChargeResult(processor_txn_id=ref.id, status=ref.status, raw=ref.to_dict())

    def capture(self, processor_txn_id: str, amount_cents: int | None = None) -> ChargeResult:
        stripe = self._client()
        kwargs = {}
        if amount_cents:
            kwargs["amount_to_capture"] = amount_cents
        pi = stripe.PaymentIntent.capture(processor_txn_id, **kwargs)
        return ChargeResult(processor_txn_id=pi.id, status=pi.status, raw=pi.to_dict())

    def release(self, processor_txn_id: str) -> ChargeResult:
        stripe = self._client()
        pi = stripe.PaymentIntent.cancel(processor_txn_id)
        return ChargeResult(processor_txn_id=pi.id, status=pi.status, raw=pi.to_dict())

    def preauth(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        stripe = self._client()
        pi = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency.lower(),
            capture_method="manual",
            payment_method=kwargs.get("payment_method"),
            customer=kwargs.get("customer"),
            confirm=bool(kwargs.get("payment_method")),
            metadata=kwargs.get("metadata") or {},
        )
        return ChargeResult(processor_txn_id=pi.id, status=pi.status, raw=pi.to_dict())
