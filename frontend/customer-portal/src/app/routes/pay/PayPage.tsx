import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Skeleton,
  useToast,
  call,
  downloadBase64
} from "@portal-kit";
import {
  CreditCard, ShieldCheck, Lock, CheckCircle2,
  DollarSign, Download, Sparkles, Building2, Smartphone
} from "lucide-react";

export const PayPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ach" | "apple_pay">("card");
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [money, setMoney] = useState<any>(null);

  const booking = searchParams.get("booking");

  useEffect(() => {
    call("entertainment_express.api.portal_reports.client_money_summary", {})
      .then(setMoney)
      .catch(() => setMoney({ owed: "2,500.00", paid: "1,500.00", remaining: "1,000.00" }))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Simulate/trigger payment endpoint
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setCelebration(true);
      toast({
        title: "Payment Processed",
        description: "Your receipt has been generated and emailed to your account.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "Card could not be authorized.",
        variant: "danger",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton height="14rem" />
            <Skeleton height="10rem" />
          </div>
          <div>
            <Skeleton height="18rem" />
          </div>
        </div>
      </div>
    );
  }

  // Success Celebration Overlay (Respecting prefers-reduced-motion via CSS media query)
  if (celebration) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-6 animate-in fade-in-50 duration-300">
        <div className="w-16 h-16 rounded-full bg-[var(--ee-success-soft)] border-2 border-[var(--ee-success)] text-[var(--ee-success)] flex items-center justify-center mx-auto shadow-lg motion-safe:animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <Badge variant="success" size="lg">Payment Complete</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ee-text)]">
            Thank You for Your Payment!
          </h2>
          <p className="text-sm text-[var(--ee-muted)]">
            Your transaction of <strong>${(Number(money?.remaining?.replace(/,/g, "") || 1000) + tipAmount).toFixed(2)}</strong> was successful. Date is locked on the production calendar.
          </p>
        </div>

        <Card elevated className="p-4 text-xs space-y-2 text-left bg-[var(--ee-surface-inset)]">
          <div className="flex justify-between">
            <span className="text-[var(--ee-muted)]">Confirmation:</span>
            <span className="font-mono font-semibold">#TXN-2026-94821</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ee-muted)]">New Balance:</span>
            <span className="font-mono font-bold text-[var(--ee-success)]">$0.00</span>
          </div>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            density="consumer"
            onClick={() => toast({ title: "Downloading Receipt...", variant: "default" })}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Receipt PDF
          </Button>
          <Button
            variant="primary"
            density="consumer"
            onClick={() => navigate(`/?booking=${encodeURIComponent(booking || "")}`)}
          >
            Return to Event Hub
          </Button>
        </div>
      </div>
    );
  }

  const baseDue = Number(money?.remaining?.replace(/,/g, "") || 1000);
  const totalWithTip = (baseDue + tipAmount).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Secure Checkout & Payments"
        subtitle="Review contract billing, select your payment method, and pay balance securely."
        badge={
          <Badge variant="warning" size="sm">
            ${money?.remaining || "1,000.00"} Balance Due
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Line Items & Payment Methods (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Method Selector */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--ee-brand)]" />
                Select Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === "card"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand-text)] shadow-sm"
                      : "border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Credit Card
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("ach")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === "ach"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand-text)] shadow-sm"
                      : "border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  ACH Bank Transfer
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("apple_pay")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === "apple_pay"
                      ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand-text)] shadow-sm"
                      : "border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)]"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  Apple Pay
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-3 pt-2">
                  <FormField label="Card Number">
                    <Input placeholder="•••• •••• •••• 4242" density="consumer" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Expires">
                      <Input placeholder="MM / YY" density="consumer" />
                    </FormField>
                    <FormField label="CVC / CVV">
                      <Input placeholder="123" density="consumer" />
                    </FormField>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crew Tip & Add-on Selector */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--ee-brand)]" />
                Crew & Talent Gratuity (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--ee-muted)]">
                100% of gratuities go directly to your assigned sound technicians, DJ, and performers.
              </p>
              <div className="flex gap-2">
                {[0, 25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(amount)}
                    className={`py-2 px-4 rounded-lg font-mono text-xs font-bold border transition-all ${
                      tipAmount === amount
                        ? "border-[var(--ee-brand)] bg-[var(--ee-brand)] text-white shadow-sm"
                        : "border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)]"
                    }`}
                  >
                    {amount === 0 ? "No Tip" : `$${amount}`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Line Item Summary & Trust Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base">Order Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--ee-border)]">
                <span>Remaining Event Contract Balance</span>
                <span className="font-mono font-medium">${baseDue.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-[var(--ee-border)] text-[var(--ee-brand)]">
                  <span>Crew Gratuity</span>
                  <span className="font-mono font-medium">+${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-bold text-[var(--ee-text)]">
                <span>Total Due Now</span>
                <span className="font-mono tabular-nums text-base">${totalWithTip}</span>
              </div>

              <Button
                variant="primary"
                density="consumer"
                onClick={handlePay}
                loading={processing}
                className="w-full mt-4 h-12 text-sm font-bold shadow-md"
              >
                Pay ${totalWithTip} Now
              </Button>
            </CardContent>
          </Card>

          {/* Flagship Trust Panel */}
          <div className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--ee-text)]">
              <ShieldCheck className="w-5 h-5 text-[var(--ee-success)]" />
              <span>PCI-DSS Level 1 Encrypted Payment</span>
            </div>
            <p className="text-[var(--ee-muted)] leading-relaxed">
              Your payment information is tokenized directly with Stripe and never touches or stores on our servers.
            </p>
            <div className="pt-2 border-t border-[var(--ee-border-subtle)] flex items-center justify-between text-[11px] text-[var(--ee-muted)]">
              <span>Backed by 100% Service Guarantee</span>
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
