import React, { useState, useEffect } from "react";
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
  useToast,
  Skeleton,
  call
} from "@portal-kit";
import {
  AlertTriangle, ShieldAlert, Users, TrendingDown, History, CheckCircle2, Lock
} from "lucide-react";

export const EmergencyOverridesPage: React.FC = () => {
  const { toast } = useToast();
  const [activeType, setActiveType] = useState<"safety" | "dispatch" | "margin">("safety");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetId, setTargetId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [marginPct, setMarginPct] = useState("15");
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const res = await call("entertainment_express.api.owner_overrides.get_override_logs", { limit: 50 });
      setLogs(res || []);
    } catch (e: any) {
      console.warn("Could not load override logs", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeOverride = async () => {
    if (!reason || reason.trim().length < 10) {
      toast({
        title: "Reason Required",
        description: "Please provide a detailed business justification (at least 10 characters).",
        variant: "destructive"
      });
      return;
    }

    if (!bookingId) {
      toast({
        title: "Booking ID Required",
        description: "Please specify the affected event booking.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (activeType === "safety") {
        await call("entertainment_express.api.owner_overrides.override_safety_lock", {
          asset_id: targetId || "OVERRIDE-ALL",
          booking_id: bookingId,
          reason
        });
      } else if (activeType === "dispatch") {
        await call("entertainment_express.api.owner_overrides.override_dispatch_conflict", {
          target_id: targetId || "CREW-OVERRIDE",
          booking_id: bookingId,
          target_type: "Crew / Vehicle",
          reason
        });
      } else {
        await call("entertainment_express.api.owner_overrides.override_margin_lock", {
          booking_id: bookingId,
          target_margin_pct: parseFloat(marginPct),
          reason
        });
      }

      toast({
        title: "Emergency Override Authorized",
        description: "Lock unblocked. Event schedule updated and audit trail logged."
      });

      setReason("");
      setTargetId("");
      setBookingId("");
      loadAuditLogs();
    } catch (e: any) {
      toast({
        title: "Authorization Failed",
        description: e?.message || "Could not process override.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Emergency Override Center"
        subtitle="Authorize auditable operational bypasses for safety compliance locks, dispatch conflicts, and low-margin proposals."
        actions={
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-950/20 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Audited & Tamper-Evident
          </Badge>
        }
      />

      {/* Override Action Card */}
      <Card className="bg-zinc-950 border border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Authorize Operational Bypass
            </CardTitle>
            <div className="flex gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
              <button
                onClick={() => setActiveType("safety")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeType === "safety"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Safety Lock
              </button>
              <button
                onClick={() => setActiveType("dispatch")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeType === "dispatch"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dispatch Conflict
              </button>
              <button
                onClick={() => setActiveType("margin")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeType === "margin"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Margin Override
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300">
            <strong>Owner Notice:</strong> All emergency overrides are permanently recorded in the immutable tenant audit ledger with your user ID and timestamp.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Target Event Booking ID *">
              <Input
                placeholder="e.g. BK-2026-00042"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </FormField>

            {activeType === "safety" && (
              <FormField label="Asset ID or Inflatable Unit (Optional)">
                <Input
                  placeholder="e.g. AST-BOUNCE-01"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </FormField>
            )}

            {activeType === "dispatch" && (
              <FormField label="Worker or Vehicle ID *">
                <Input
                  placeholder="e.g. EMP-0012 or VAN-02"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </FormField>
            )}

            {activeType === "margin" && (
              <FormField label="Approved Target Margin (%) *">
                <Input
                  type="number"
                  value={marginPct}
                  onChange={(e) => setMarginPct(e.target.value)}
                  placeholder="15"
                />
              </FormField>
            )}

            <div className="sm:col-span-2">
              <FormField label="Business Justification & Sign-off * (minimum 10 characters)">
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this emergency bypass is authorized (e.g., 'Emergency client replacement on event day; physical inspection verified by owner')..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleAuthorizeOverride}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {submitting ? "Signing & Authorizing..." : "Authorize Emergency Bypass"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Audit Trail Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-lg text-white">Override Audit History</h3>
        </div>

        <Card className="bg-zinc-950 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target Booking</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5">Reason & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No operational overrides recorded. Platform running within nominal bounds.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.name} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 text-xs text-zinc-400 whitespace-nowrap">{l.creation}</td>
                      <td className="p-3.5 font-medium text-amber-400 whitespace-nowrap">{l.action}</td>
                      <td className="p-3.5 font-mono text-xs text-white">{l.related_name || "-"}</td>
                      <td className="p-3.5 text-xs text-zinc-300">{l.actor}</td>
                      <td className="p-3.5 text-xs text-zinc-400 max-w-md truncate">{l.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
