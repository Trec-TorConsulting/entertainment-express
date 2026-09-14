import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
  call,
} from "@portal-kit";
import {
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck,
} from "lucide-react";
import { PayrollBatchModal } from "./components/PayrollBatchModal";

export const PayrollSettlementPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [payRuns, setPayRuns] = useState<any[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [batchPreview, setBatchPreview] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsRes, tsRes] = await Promise.all([
        call("entertainment_express.api.portal_hr.list_pay_runs", {}).catch(() => []),
        call("entertainment_express.api.portal_hr.list_timesheets", {}).catch(() => []),
      ]);
      setPayRuns(runsRes || []);
      const pending = (tsRes || []).filter((t: any) => t.pending || t.status === "draft").length;
      setPendingTimesheets(pending);
    } catch (err: any) {
      toast({
        title: "Error loading payroll data",
        description: err?.message || "Failed to load settlement history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePreviewBatch = async () => {
    setPreviewLoading(true);
    try {
      const preview = await call("entertainment_express.api.payroll.preview_payroll_batch", {
        start_date: startDate,
        end_date: endDate,
      });

      if (!preview || preview.worker_count === 0) {
        toast({
          title: "No Payroll Records Found",
          description: `No active timesheets, tips, or commissions found between ${startDate} and ${endDate}.`,
        });
        return;
      }

      setBatchPreview(preview);
      setModalOpen(true);
    } catch (err: any) {
      toast({
        title: "Preview Error",
        description: err?.message || "Could not preview payroll batch.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gig Payroll & Settlements"
        subtitle="Automate event worker pay cards, sales commissions, tip pool splitting, and ERPNext salary batch compilation."
      />

      {/* Pay Run Compiler Tool Card */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Process Gig Pay Run
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select pay period dates to compile event timesheets, booking commissions, and tip shares into draft ERPNext Salary Slips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={pendingTimesheets > 0 ? "default" : "secondary"}>
              {pendingTimesheets} Unapproved Timesheets
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Period Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Period End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handlePreviewBatch}
              disabled={previewLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
            >
              <Receipt className="w-4 h-4 mr-2" />
              {previewLoading ? "Compiling..." : "Preview & Settle Payroll"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Historical Pay Runs */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Recent Settled Pay Runs
        </h3>

        {loading ? (
          <Skeleton height="160px" />
        ) : payRuns.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No previous pay runs recorded. Run your first payroll compilation above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Pay Run ID</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payRuns.map((run) => (
                  <tr key={run.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {run.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {run.period_from} → {run.period_to}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ${(run.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={run.status === "paid" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {run.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <PayrollBatchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        batchData={batchPreview}
        onSubmitted={() => fetchData()}
      />
    </div>
  );
};

export default PayrollSettlementPage;
