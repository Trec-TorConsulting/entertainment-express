"""Non-Stripe processors: hosted checkout and refunds when keys exist; otherwise closed."""

from __future__ import annotations

import json
import os
import secrets
import urllib.error
import urllib.request

from entertainment_express.billing_payments.processors import ChargeResult, Processor, ProcessorError


def _json_request(method: str, url: str, headers: dict, body: dict | None = None, timeout: int = 20) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    for key, value in headers.items():
        req.add_header(key, value)
    if body is not None and "Content-Type" not in headers:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8") or "{}"
            return json.loads(raw)
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")[:400]
        raise ProcessorError(f"{err.code}: {detail}") from err
    except urllib.error.URLError as err:
        raise ProcessorError(str(err.reason or err)) from err


class SquareProcessor(Processor):
    name = "square"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_SQUARE_ACCESS_TOKEN"))

    def _token(self) -> str:
        self._require()
        return os.environ["EE_SQUARE_ACCESS_TOKEN"]

    def hosted_checkout(self, amount_cents: int, currency: str, **kwargs) -> dict:
        token = self._token()
        payload = {
            "idempotency_key": kwargs.get("idempotency_key") or secrets.token_hex(8),
            "quick_pay": {
                "name": kwargs.get("description") or "Event payment",
                "price_money": {"amount": int(amount_cents), "currency": (currency or "USD").upper()},
            },
            "checkout_options": {"redirect_url": kwargs.get("success_url") or ""},
            "payment_note": json.dumps(kwargs.get("metadata") or {}),
        }
        data = _json_request(
            "POST",
            "https://connect.squareup.com/v2/online-checkout/payment-links",
            {"Authorization": f"Bearer {token}", "Square-Version": "2024-01-18"},
            payload,
        )
        link = (data.get("payment_link") or {})
        url = link.get("url") or ""
        if not url:
            raise ProcessorError("Square did not return a pay link.")
        return {"checkout_url": url, "session_id": link.get("id") or ""}

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        token = self._token()
        data = _json_request(
            "POST",
            "https://connect.squareup.com/v2/refunds",
            {"Authorization": f"Bearer {token}", "Square-Version": "2024-01-18"},
            {
                "idempotency_key": secrets.token_hex(8),
                "payment_id": processor_txn_id,
                "amount_money": {"amount": int(amount_cents), "currency": "USD"},
                "reason": (reason or "refund")[:200],
            },
        )
        refund = data.get("refund") or data
        return ChargeResult(processor_txn_id=str(refund.get("id") or ""), status=refund.get("status") or "pending", raw=data)

    def charge(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        token = self._token()
        source = kwargs.get("payment_method") or kwargs.get("source_id")
        if not source:
            raise ProcessorError("Square charge needs a saved card token.")
        data = _json_request(
            "POST",
            "https://connect.squareup.com/v2/payments",
            {"Authorization": f"Bearer {token}", "Square-Version": "2024-01-18"},
            {
                "idempotency_key": secrets.token_hex(8),
                "source_id": source,
                "amount_money": {"amount": int(amount_cents), "currency": (currency or "USD").upper()},
                "note": json.dumps(kwargs.get("metadata") or {}),
            },
        )
        payment = data.get("payment") or data
        return ChargeResult(processor_txn_id=str(payment.get("id") or ""), status=payment.get("status") or "pending", raw=data)


class PayPalProcessor(Processor):
    name = "paypal"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_PAYPAL_CLIENT_ID") and os.environ.get("EE_PAYPAL_CLIENT_SECRET"))

    def _access_token(self) -> str:
        self._require()
        cid = os.environ["EE_PAYPAL_CLIENT_ID"]
        secret = os.environ["EE_PAYPAL_CLIENT_SECRET"]
        base = os.environ.get("EE_PAYPAL_BASE", "https://api-m.paypal.com")
        import base64

        basic = base64.b64encode(f"{cid}:{secret}".encode()).decode()
        return self._token_form(base, basic)["access_token"]

    def _token_form(self, base: str, basic: str) -> dict:
        req = urllib.request.Request(
            f"{base}/v1/oauth2/token",
            data=b"grant_type=client_credentials",
            method="POST",
        )
        req.add_header("Authorization", f"Basic {basic}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def hosted_checkout(self, amount_cents: int, currency: str, **kwargs) -> dict:
        token = self._access_token()
        base = os.environ.get("EE_PAYPAL_BASE", "https://api-m.paypal.com")
        amount = f"{amount_cents / 100:.2f}"
        data = _json_request(
            "POST",
            f"{base}/v2/checkout/orders",
            {"Authorization": f"Bearer {token}"},
            {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {"currency_code": (currency or "USD").upper(), "value": amount},
                        "custom_id": (kwargs.get("metadata") or {}).get("invoice_name") or "",
                    }
                ],
                "application_context": {
                    "return_url": kwargs.get("success_url") or "",
                    "cancel_url": kwargs.get("cancel_url") or "",
                    "brand_name": kwargs.get("description") or "Entertainment Express",
                },
            },
        )
        approve = ""
        for link in data.get("links") or []:
            if link.get("rel") == "approve":
                approve = link.get("href") or ""
        if not approve:
            raise ProcessorError("PayPal did not return an approve link.")
        return {"checkout_url": approve, "session_id": data.get("id") or ""}

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        token = self._access_token()
        base = os.environ.get("EE_PAYPAL_BASE", "https://api-m.paypal.com")
        data = _json_request(
            "POST",
            f"{base}/v2/payments/captures/{processor_txn_id}/refund",
            {"Authorization": f"Bearer {token}"},
            {"amount": {"currency_code": "USD", "value": f"{amount_cents / 100:.2f}"}, "note_to_payer": (reason or "")[:200]},
        )
        return ChargeResult(processor_txn_id=str(data.get("id") or ""), status=data.get("status") or "pending", raw=data)

    def charge(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        self._require()
        raise ProcessorError("PayPal vault charges need a saved PayPal billing agreement.")


class ACHProcessor(Processor):
    name = "ach"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_STRIPE_SECRET_KEY", "").startswith("sk_"))

    def hosted_checkout(self, amount_cents: int, currency: str, **kwargs) -> dict:
        self._require()
        import stripe

        stripe.api_key = os.environ["EE_STRIPE_SECRET_KEY"]
        session = stripe.checkout.Session.create(
            payment_method_types=["us_bank_account"],
            line_items=[
                {
                    "price_data": {
                        "currency": (currency or "usd").lower(),
                        "unit_amount": int(amount_cents),
                        "product_data": {"name": kwargs.get("description") or "Event payment (ACH)"},
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=kwargs.get("success_url") or "",
            cancel_url=kwargs.get("cancel_url") or "",
            metadata=kwargs.get("metadata") or {},
        )
        return {"checkout_url": session.url, "session_id": session.id}

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        self._require()
        import stripe

        stripe.api_key = os.environ["EE_STRIPE_SECRET_KEY"]
        ref = stripe.Refund.create(payment_intent=processor_txn_id, amount=int(amount_cents))
        return ChargeResult(processor_txn_id=ref.id, status=ref.status, raw=ref.to_dict())

    def charge(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        self._require()
        import stripe

        stripe.api_key = os.environ["EE_STRIPE_SECRET_KEY"]
        pi = stripe.PaymentIntent.create(
            amount=int(amount_cents),
            currency=(currency or "usd").lower(),
            payment_method_types=["us_bank_account"],
            payment_method=kwargs.get("payment_method"),
            customer=kwargs.get("customer"),
            confirm=bool(kwargs.get("payment_method")),
            metadata=kwargs.get("metadata") or {},
        )
        return ChargeResult(processor_txn_id=pi.id, status=pi.status, raw=pi.to_dict())


class AuthorizeNetProcessor(Processor):
    name = "authorizenet"

    def configured(self) -> bool:
        return bool(os.environ.get("EE_AUTHORIZENET_API_LOGIN") and os.environ.get("EE_AUTHORIZENET_TRANSACTION_KEY"))

    def _endpoint(self) -> str:
        if os.environ.get("EE_AUTHORIZENET_SANDBOX") == "1":
            return "https://apitest.authorize.net/xml/v1/request.api"
        return "https://api.authorize.net/xml/v1/request.api"

    def hosted_checkout(self, amount_cents: int, currency: str, **kwargs) -> dict:
        self._require()
        payload = {
            "getHostedPaymentPageRequest": {
                "merchantAuthentication": {
                    "name": os.environ["EE_AUTHORIZENET_API_LOGIN"],
                    "transactionKey": os.environ["EE_AUTHORIZENET_TRANSACTION_KEY"],
                },
                "transactionRequest": {
                    "transactionType": "authCaptureTransaction",
                    "amount": f"{amount_cents / 100:.2f}",
                    "order": {"invoiceNumber": ((kwargs.get("metadata") or {}).get("invoice_name") or "")[:20]},
                },
                "hostedPaymentSettings": {
                    "setting": [
                        {
                            "settingName": "hostedPaymentReturnOptions",
                            "settingValue": json.dumps(
                                {
                                    "url": kwargs.get("success_url") or "",
                                    "cancelUrl": kwargs.get("cancel_url") or "",
                                    "showReceipt": False,
                                }
                            ),
                        }
                    ]
                },
            }
        }
        data = _json_request("POST", self._endpoint(), {}, payload)
        token = data.get("token")
        if not token:
            raise ProcessorError("Authorize.Net did not return a hosted page token.")
        form = "https://test.authorize.net/payment/payment" if os.environ.get("EE_AUTHORIZENET_SANDBOX") == "1" else "https://accept.authorize.net/payment/payment"
        return {"checkout_url": f"{form}?token={token}", "session_id": token}

    def refund(self, processor_txn_id: str, amount_cents: int, reason: str) -> ChargeResult:
        self._require()
        payload = {
            "createTransactionRequest": {
                "merchantAuthentication": {
                    "name": os.environ["EE_AUTHORIZENET_API_LOGIN"],
                    "transactionKey": os.environ["EE_AUTHORIZENET_TRANSACTION_KEY"],
                },
                "transactionRequest": {
                    "transactionType": "refundTransaction",
                    "amount": f"{amount_cents / 100:.2f}",
                    "refTransId": processor_txn_id,
                },
            }
        }
        data = _json_request("POST", self._endpoint(), {}, payload)
        trans = ((data.get("transactionResponse") or {}) if isinstance(data, dict) else {}) or {}
        status = "succeeded" if str(trans.get("responseCode") or "") in ("1",) else "failed"
        return ChargeResult(processor_txn_id=str(trans.get("transId") or processor_txn_id), status=status, raw=data)

    def charge(self, amount_cents: int, currency: str, **kwargs) -> ChargeResult:
        self._require()
        pm = kwargs.get("payment_method")
        if not pm:
            raise ProcessorError("Authorize.Net charge needs a saved customer profile.")
        payload = {
            "createTransactionRequest": {
                "merchantAuthentication": {
                    "name": os.environ["EE_AUTHORIZENET_API_LOGIN"],
                    "transactionKey": os.environ["EE_AUTHORIZENET_TRANSACTION_KEY"],
                },
                "transactionRequest": {
                    "transactionType": "authCaptureTransaction",
                    "amount": f"{amount_cents / 100:.2f}",
                    "profile": {"customerProfileId": kwargs.get("customer"), "paymentProfile": {"paymentProfileId": pm}},
                },
            }
        }
        data = _json_request("POST", self._endpoint(), {}, payload)
        trans = data.get("transactionResponse") or {}
        return ChargeResult(processor_txn_id=str(trans.get("transId") or ""), status="succeeded" if str(trans.get("responseCode")) == "1" else "failed", raw=data)
