import React, { useEffect, useState } from "react";
import {
  Button,
  Badge,
  Skeleton,
  MarginHealthBadge,
  useToast,
  call
} from "@portal-kit";
import {
  X,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Box,
  Wrench,
  CreditCard,
  Calendar,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle
} from "lucide-react";

interface EventPLDrawerProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTargetUpdated?: () => void;
}

export const EventPLDrawer: React.FC<EventPLDrawerProps> = ({
  bookingId,
  isOpen,
  onClose,
  onTargetUpdated,
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("40");
  const [savingTarget, setSavingTarget] = useState(false);
  const [settling, setSettling] = useState(false);

  const handleSettle = async () => {
    if (!bookingId) return;
    setSettling(true);
    try {
      const res = await call("entertainment_express.job_costing.settlement.settle_event_cost_center", {
        booking_name: bookingId,
      });
      toast({
        title: "Ledger Settled & Locked",
        description: `Cost center locked. Final margin: ${res.final_margin?.toFixed(1) || 0}%`,
        variant: "success",
      });
      fetchPL(true);
    } catch (err: any) {
      toast({
        title: "Settlement Failed",
        description: err.message || "Could not lock cost center.",
        variant: "danger",
      });
    } finally {
      setSettling(false);
    }
  };

  const fetchPL = async (isRefresh = false) => {
    if (!bookingId) return;
    if (isRefresh) setRecomputing(true);
    else setLoading(true);

    try {
      const res = await call("entertainment_express.api.job_costing.get_event_pl", {
        booking_name: bookingId,
      });
      setData(res);
      setTargetInput(String(res?.target_margin_percent || 40));
    } catch (err: any) {
      toast({
        title: "Failed to load Event P&L",
        description: err.message || "An unexpected error occurred.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
      setRecomputing(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchPL();
    } else {
      setData(null);
      setEditingTarget(false);
    }
  }, [isOpen, bookingId]);

  const handleSaveTarget = async () => {
    const num = parseFloat(targetInput);
    if (isNaN(num) || num < 0 || num > 100) {
      toast({ title: "Invalid Target", description: "Must be between 0% and 100%.", variant: "warning" });
      return;
    }
    setSavingTarget(true);
    try {
      await call("entertainment_express.api.job_costing.set_event_margin_target", {
        booking_name: bookingId,
        target_percent: num,
      });
      toast({ title: "Margin Target Updated", description: `Target set to ${num}%`, variant: "success" });
      setEditingTarget(false);
      fetchPL(true);
      if (onTargetUpdated) onTargetUpdated();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "danger" });
    } finally {
      setSavingTarget(false);
    }
  };

  if (!isOpen) return null;

  const gross = data?.gross_revenue || 0;
  const cogs = data?.total_cogs || 0;
  const profit = data?.net_profit || 0;
  const margin = data?.margin_percent || 0;

  // Breakdown percentages of total COGS
  const labor = data?.labor_cost || 0;
  const sub = data?.subcontractor_cost || 0;
  const consumables = data?.consumable_cost || 0;
  const wear = data?.equipment_wear_cost || 0;
  const fees = data?.gateway_fees || 0;

  const laborPct = cogs > 0 ? (labor / cogs) * 100 : 0;
  const subPct = cogs > 0 ? (sub / cogs) * 100 : 0;
  const consPct = cogs > 0 ? (consumables / cogs) * 100 : 0;
  const wearPct = cogs > 0 ? (wear / cogs) * 100 : 0;
  const feesPct = cogs > 0 ? (fees / cogs) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-2xl bg-(--ee-card-bg,white) dark:bg-slate-900 border-l border-(--ee-border,slate-200) dark:border-slate-800 shadow-2xl flex flex-col h-full z-10">
        {/* Header */}
        <div className="p-6 border-b border-(--ee-border,slate-200) dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {bookingId}
              </span>
              <Badge variant="outline" className="capitalize text-xs">
                {data?.booking_status || "confirmed"}
              </Badge>
              {data && (
                <MarginHealthBadge
                  status={data.margin_status}
                  marginPercent={data.margin_percent}
                  size="sm"
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-(--ee-text,slate-900) dark:text-white">
              {data?.event_name || "Event Profit & Loss"}
            </h2>
            <p className="text-xs text-(--ee-muted,slate-500) mt-0.5 flex items-center gap-3">
              <span>Customer: <strong className="text-slate-700 dark:text-slate-300">{data?.customer_name || data?.customer}</strong></span>
              {data?.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {data.event_date}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPL(true)}
              disabled={recomputing}
              title="Recalculate P&L from ledger"
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw size={16} className={recomputing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : data ? (
            <>
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Gross Revenue</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    ${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Total COGS</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    ${cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Net Profit</span>
                  <div className={`text-lg font-bold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Margin</span>
                    <button
                      onClick={() => setEditingTarget(!editingTarget)}
                      className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5"
                    >
                      <Sliders size={11} /> Target
                    </button>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {margin.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Target Margin Editor */}
              {editingTarget && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <strong className="block text-indigo-900 dark:text-indigo-300 font-semibold mb-0.5">Configure Target Margin</strong>
                    Current target is {data.target_margin_percent}%. Adjusting will update status alerts for this job.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right pr-6"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                    </div>
                    <Button size="sm" onClick={handleSaveTarget} disabled={savingTarget}>
                      <Check size={14} className="mr-1" /> Save
                    </Button>
                  </div>
                </div>
              )}

              {/* Margin Drift & Anomaly Inspector */}
              {(data.margin_drift_percent > 0 || data.is_ledger_locked) && (
                <div className={`p-4 rounded-xl border ${
                  data.margin_drift_percent > 5
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                    : "border-slate-700 bg-slate-800/40 text-slate-300"
                } flex items-center justify-between gap-4 text-xs`}>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5 mb-1">
                      <AlertCircle size={15} className={data.margin_drift_percent > 5 ? "text-amber-400" : "text-slate-400"} />
                      Margin Drift Inspector
                    </div>
                    <p>
                      Projected Margin: <strong>{data.projected_margin_percent?.toFixed(1) || "40.0"}%</strong> → Actual Margin: <strong>{margin.toFixed(1)}%</strong>
                    </p>
                    <p className="mt-0.5 opacity-80">
                      Drift Degradation: <strong>{data.margin_drift_percent?.toFixed(1) || "0.0"}%</strong> {data.margin_drift_percent > 5 ? "(Exceeds 5% tolerance threshold)" : "(Within tolerance)"}
                    </p>
                  </div>
                  {data.is_ledger_locked ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-950/40 px-3 py-1 text-xs">
                      🔒 Ledger Locked
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleSettle} disabled={settling}>
                      {settling ? "Locking..." : "1-Click Settle & Lock"}
                    </Button>
                  )}
                </div>
              )}

              {/* Stacked COGS Visualizer */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider">COGS Distribution</span>
                  <span className="text-slate-500">Total: ${cogs.toFixed(2)}</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {laborPct > 0 && (
                    <div style={{ width: `${laborPct}%` }} className="bg-indigo-500 transition-all" title={`Labor: ${laborPct.toFixed(1)}% ($${labor})`} />
                  )}
                  {subPct > 0 && (
                    <div style={{ width: `${subPct}%` }} className="bg-purple-500 transition-all" title={`Subcontractors: ${subPct.toFixed(1)}% ($${sub})`} />
                  )}
                  {consPct > 0 && (
                    <div style={{ width: `${consPct}%` }} className="bg-amber-500 transition-all" title={`Consumables: ${consPct.toFixed(1)}% ($${consumables})`} />
                  )}
                  {wearPct > 0 && (
                    <div style={{ width: `${wearPct}%` }} className="bg-teal-500 transition-all" title={`Wear & Tear: ${wearPct.toFixed(1)}% ($${wear})`} />
                  )}
                  {feesPct > 0 && (
                    <div style={{ width: `${feesPct}%` }} className="bg-rose-500 transition-all" title={`Gateway Fees: ${feesPct.toFixed(1)}% ($${fees})`} />
                  )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-300">Labor:</span>
                    <strong className="text-slate-900 dark:text-white">${labor.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-slate-600 dark:text-slate-300">Subcontractors:</span>
                    <strong className="text-slate-900 dark:text-white">${sub.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300">Consumables:</span>
                    <strong className="text-slate-900 dark:text-white">${consumables.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-slate-600 dark:text-slate-300">Equipment Wear:</span>
                    <strong className="text-slate-900 dark:text-white">${wear.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600 dark:text-slate-300">Gateway Fees:</span>
                    <strong className="text-slate-900 dark:text-white">${fees.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized Audit Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Itemized Cost & Revenue Ledger
                  </h3>
                  <span className="text-xs text-slate-500">
                    {data.ledger_lines?.length || 0} entries
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {data.ledger_lines && data.ledger_lines.length > 0 ? (
                    data.ledger_lines.map((line: any, idx: number) => {
                      const isRev = line.category === "revenue";
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <div className="flex items-center gap-3">
                            <span
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                isRev
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : line.category === "labor"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                  : line.category === "subcontractor"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                  : line.category === "consumable"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : line.category === "equipment_wear"
                                  ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {line.category}
                            </span>
                            <div>
                              <div className="text-xs font-medium text-slate-900 dark:text-white">
                                {line.description}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {line.source_doctype} • {line.source_name}
                                {line.date ? ` • ${line.date}` : ""}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              isRev
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {isRev ? "+" : "-"}${parseFloat(line.amount || 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No discrete ledger lines recorded yet. Costs will populate as timesheets, invoices, and expenses submit.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select an event booking to inspect profitability.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--ee-border,slate-200) dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <span className="text-xs text-slate-500 font-mono">
            Linked Project: {data?.project || "Auto-managed"}
          </span>
          <div className="flex items-center gap-2">
            {data && !data.is_ledger_locked && (
              <Button size="sm" variant="primary" onClick={handleSettle} disabled={settling}>
                {settling ? "Locking..." : "Lock Ledger & Settle Cost Center"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
