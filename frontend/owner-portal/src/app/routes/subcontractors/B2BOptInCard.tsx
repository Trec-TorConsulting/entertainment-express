import React, { useEffect, useState } from "react";
import { Card, CardContent, Button, useToast, call } from "@portal-kit";
import { Globe, ShieldCheck, Zap, Bell, CheckCircle2 } from "lucide-react";

export const B2BOptInCard: React.FC = () => {
  const { toast } = useToast();
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    call("entertainment_express.api.subcontractors.get_b2b_opt_in_status", {})
      .then((res: any) => {
        if (res && typeof res.b2b_exchange_opt_in === "boolean") {
          setOptIn(res.b2b_exchange_opt_in);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (nextVal: boolean) => {
    setSaving(true);
    try {
      const res: any = await call("entertainment_express.api.subcontractors.toggle_b2b_opt_in", { opt_in: nextVal });
      setOptIn(res.b2b_exchange_opt_in);
      toast({
        title: nextVal ? "Opted In to B2B Exchange" : "Opted Out of B2B Exchange",
        description: nextVal
          ? "Your company will now receive B2B overflow job alerts matching your vertical."
          : "You will no longer receive broadcast alerts for network jobs."
      });
    } catch (err: any) {
      toast({ title: "Failed to Update Settings", description: err.message || "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card elevated className={`overflow-hidden border transition-all ${optIn ? "bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/40" : "bg-[var(--ee-panel)] border-[var(--ee-border)]"}`}>
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl border ${optIn ? "bg-purple-600/30 border-purple-500/50 text-purple-300" : "bg-[var(--ee-surface-inset)] border-[var(--ee-border)] text-[var(--ee-muted)]"}`}>
            <Globe className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--ee-text)]">B2B Overflow Network Exchange</h3>
              {optIn ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active Opt-In
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Opt-In Required
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ee-muted)] mt-1 max-w-xl">
              Receive broadcast alerts when peer entertainment companies list overbooked events in your area. All network claims require verified active COI insurance ($1M+ coverage).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant={optIn ? "outline" : "primary"}
            density="cockpit"
            onClick={() => handleToggle(!optIn)}
            loading={saving}
            leftIcon={optIn ? <Bell className="w-3.5 h-3.5 text-purple-400" /> : <Zap className="w-3.5 h-3.5" />}
          >
            {optIn ? "Opt-Out of Blasts" : "Opt-In for B2B Alerts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
