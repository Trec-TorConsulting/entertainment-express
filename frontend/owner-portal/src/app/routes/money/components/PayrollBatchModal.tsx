import React, { useState } from "react";
import {
  Dialog,
  Button,
  Badge,
  useToast,
  call,
} from "@portal-kit";
import {
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Edit2,
  AlertCircle,
} from "lucide-react";

interface PayrollBatchModalProps {
  open: boolean;
  onClose: () => void;
  batchData: {
    start_date: string;
    end_date: string;
    total_gross: number;
    worker_count: number;
    slips: Array<{
      employee: string;
      employee_name: string;
      hours_worked: number;
      events_count: number;
      gross_pay: number;
      earnings: Array<{
        salary_component: string;
        amount: number;
      }>;
    }>;
  } | null;
  onSubmitted?: () => void;
}

export const PayrollBatchModal: React.FC<PayrollBatchModalProps> = ({
  open,
  onClose,
  batchData,
  onSubmitted,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [adjustedSlips, setAdjustedSlips] = useState<any[]>([]);

  React.useEffect(() => {
    if (batchData?.slips) {
      setAdjustedSlips([...batchData.slips]);
    }
  }, [batchData]);

  if (!batchData) return null;

  const handleAdjustWorkerGross = (index: number, newGross: number) => {
    const updated = [...adjustedSlips];
    updated[index] = { ...updated[index], gross_pay: newGross };
    setAdjustedSlips(updated);
  };

  const calculatedTotal = adjustedSlips.reduce((sum, s) => sum + (s.gross_pay || 0), 0);

  const handleSubmitBatch = async () => {
    setSubmitting(true);
    try {
      const res = await call("entertainment_express.api.payroll.submit_payroll_batch", {
        start_date: batchData.start_date,
        end_date: batchData.end_date,
      });

      toast({
        title: "Payroll Batch Submitted",
        description: `Successfully generated ${res?.worker_count || adjustedSlips.length} ERPNext Salary Slips (${batchData.start_date} to ${batchData.end_date}).`,
        variant: "success",
      });

      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err?.message || "Failed to commit payroll batch.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Review & Process Payroll Batch"
      description={`Pay period from ${batchData.start_date} to ${batchData.end_date} · ERPNext Salary Slip Integration`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Batch Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs text-slate-500 font-medium">Pay Period</span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">
              {batchData.start_date} → {batchData.end_date}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Workers</span>
            <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              {adjustedSlips.length} Employees & Crew
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Batch Total Gross</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Worker Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Worker / Employee</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Base Gig Pay</th>
                <th className="px-4 py-3">Commissions</th>
                <th className="px-4 py-3">Tip Share</th>
                <th className="px-4 py-3 text-right">Gross Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {adjustedSlips.map((slip, idx) => {
                const basePay = slip.earnings?.find((e: any) => e.salary_component === "Gig Base Pay")?.amount || 0;
                const otPay = slip.earnings?.find((e: any) => e.salary_component === "Gig Overtime")?.amount || 0;
                const comm = slip.earnings?.find((e: any) => e.salary_component === "Booking Commission")?.amount || 0;
                const tips = slip.earnings?.find((e: any) => e.salary_component === "Client Tip Share")?.amount || 0;

                return (
                  <tr key={slip.employee} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {slip.employee_name || slip.employee}
                      <span className="block text-xs text-slate-400 font-mono">{slip.employee}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {slip.hours_worked || 0} hrs
                      {slip.events_count > 0 && <span className="block text-[11px] text-slate-400">{slip.events_count} events</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      ${(basePay + otPay).toFixed(2)}
                      {otPay > 0 && <span className="block text-[10px] text-amber-600">+${otPay.toFixed(2)} OT</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      ${comm.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-600 font-medium">
                      ${tips.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={slip.gross_pay}
                        onChange={(e) => handleAdjustWorkerGross(idx, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-right text-xs font-bold text-slate-900 dark:text-white rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleSubmitBatch}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {submitting ? "Compiling & Submitting..." : `Submit Payroll ($${calculatedTotal.toLocaleString()})`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PayrollBatchModal;
