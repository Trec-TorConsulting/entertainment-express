import React, { useEffect, useState } from "react";
import { InstantPayoutCard } from "../../components/InstantPayoutCard";
import { ReliabilityScorecard } from "../../components/ReliabilityScorecard";
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
  Sparkles,
  Receipt,
  FileText,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";

interface PaySlipItem {
  slip_id: string;
  period: string;
  gross: number;
  net: number;
  status: string;
}

interface EarningsSummary {
  worker: string;
  total_gross: number;
  tips_earned: number;
  pay_slips: PaySlipItem[];
}

export const MyEarningsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EarningsSummary | null>(null);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.payroll.get_my_earnings", {});
      setData(res);
    } catch (err: any) {
      toast({
        title: "Error loading earnings",
        description: err?.message || "Failed to load pay statements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Earnings & Pay Stubs"
        subtitle="Transparent itemized breakdown of base gig pay, overtime, commissions, and digital tip allocations."
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
          <Skeleton height="200px" />
        </div>
      ) : (
        <>
          {/* Instant Payout & Reliability Scorecard Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InstantPayoutCard />
            <ReliabilityScorecard />
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Gross Earnings
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    ${(data?.total_gross || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Client Tip Share Earned
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    ${(data?.tips_earned || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Pay Statements List */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                Pay Statements & Settlement Slips
              </h3>
              <Badge variant="outline">{data?.pay_slips?.length || 0} Statements</Badge>
            </div>

            {!data?.pay_slips || data.pay_slips.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No pay slips issued yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  When your shift hours or event commissions are settled into a payroll batch, your statements will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Pay Slip ID</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Net Pay</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.pay_slips.map((slip) => (
                      <tr key={slip.slip_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {slip.slip_id}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {slip.period}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          ${slip.gross.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          ${slip.net.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={slip.status === "Submitted" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {slip.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default MyEarningsPage;
