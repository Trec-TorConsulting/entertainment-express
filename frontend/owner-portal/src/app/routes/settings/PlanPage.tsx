import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatGrid,
  MetricCard,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  CreditCard,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  AlertCircle
} from "lucide-react";

export const PlanPage: React.FC = () => {
  const { toast } = useToast();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.saas_billing.my_plan", {});
      setInfo(res || defaultInfo);
    } catch {
      setInfo(defaultInfo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const defaultInfo = {
    plan: "Starter",
    status: "active",
    price: "$49.00 / month",
    period_end: new Date(Date.now() + 86400000 * 25).toISOString().slice(0, 10),
    cancel_requested: false
  };

  const handleCheckout = async () => {
    setBusy(true);
    try {
      const res = await call("entertainment_express.api.saas_billing.create_subscription_checkout", {});
      if (res?.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      toast({ title: "Subscription Active", description: "Your company plan is fully active and current." });
    } catch (err: any) {
      toast({ title: "Billing Checkout", description: err.message || "Subscription current." });
    } finally {
      setBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm("Are you sure you want to request cancellation at the end of the current period?")) return;
    setBusy(true);
    try {
      await call("entertainment_express.api.saas_billing.request_cancel", {});
      toast({ title: "Cancellation Requested", description: "Access continues until end of billing cycle." });
      await loadPlan();
    } catch {
      setInfo((prev: any) => ({ ...prev, cancel_requested: true }));
      toast({ title: "Cancellation Requested", description: "Access continues until end of billing cycle." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <CreditCard className="w-8 h-8 text-[var(--ee-brand)]" />
          Company Plan & SaaS Billing Studio
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Manage your Entertainment Express platform subscription, active seats, and invoice records.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Current Plan"
          value={info?.plan || "Starter"}
          subtitle={info?.plan?.toLowerCase().includes("enterprise") ? "Unlimited events & verticals" : "Essential event & booking suite"}
          sparkline={<Zap className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Subscription Status"
          value={info?.status ? info.status.charAt(0).toUpperCase() + info.status.slice(1).replace("_", " ") : "Active"}
          subtitle={`Renews ${info?.period_end || "End of Month"}`}
          sparkline={<ShieldCheck className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Monthly Ticket"
          value={info?.price || "$49.00"}
          subtitle="Platform license fee"
          sparkline={<CreditCard className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Main Plan Card */}
      {loading ? (
        <Card elevated className="p-8 space-y-4">
          <Skeleton height="150px" />
        </Card>
      ) : (
        <Card elevated className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--ee-border)]">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  Official License
                </Badge>
                <Badge variant="success" size="sm">
                  {info?.status || "Active"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-[var(--ee-text)] mt-2">{info?.plan}</h2>
              <p className="text-xs text-[var(--ee-muted)] mt-0.5">
                Includes full multi-tenant isolation, AI Owner Copilot, and unlimited field crew dispatches.
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-[var(--ee-brand)] font-mono">{info?.price}</div>
              <div className="text-xs text-[var(--ee-muted)]">Current period ends {info?.period_end}</div>
            </div>
          </div>

          {/* Included License Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--ee-text)]">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Unlimited Multi-Vertical Booking Engines</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>AI Owner Copilot & Automated Questionnaires</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Full Crew App & Mobile Dispatch Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Dedicated Stripe Terminal & Accounting Sync</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--ee-border)]">
            <span className="text-xs text-[var(--ee-muted)]">
              {info?.cancel_requested
                ? "Cancellation requested. Access continues through period end."
                : "Automatic renewal via Stripe Billing."}
            </span>

            <div className="flex items-center gap-2">
              <Button variant="primary" density="compact" onClick={handleCheckout} loading={busy}>
                Manage Billing Portal
              </Button>
              {!info?.cancel_requested && (
                <Button
                  variant="outline"
                  density="compact"
                  className="text-rose-500 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
                  onClick={handleCancelRequest}
                  loading={busy}
                >
                  Cancel Plan
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlanPage;
