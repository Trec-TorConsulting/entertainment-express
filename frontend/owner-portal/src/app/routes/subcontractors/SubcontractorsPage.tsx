import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Tabs,
  DataTable,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatGrid,
  MetricCard,
  EmptyState,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  Handshake,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Clock
} from "lucide-react";
import { SubOutModal } from "./SubOutModal";

export const SubcontractorsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnerForSub, setSelectedPartnerForSub] = useState<any>(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [actingJobId, setActingJobId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [jobsRes, partnersRes] = await Promise.allSettled([
        call("entertainment_express.api.subcontractors.list_subcontract_jobs", {}),
        call("entertainment_express.api.subcontractors.list_subcontractors", {})
      ]);

      if (jobsRes.status === "fulfilled") setJobs(jobsRes.value || []);
      if (partnersRes.status === "fulfilled") setPartners(partnersRes.value || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendOffer = async (jobId: string) => {
    setActingJobId(jobId);
    try {
      const res = await call("entertainment_express.api.subcontractors.send_subcontract_offer", { job_id: jobId });
      toast({ title: "Offer Dispatched", description: `Offer token generated and sent for job ${res.id}` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to Send Offer", description: err.message || "Error", variant: "destructive" });
    } finally {
      setActingJobId(null);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    setActingJobId(jobId);
    try {
      const res = await call("entertainment_express.api.subcontractors.complete_subcontract_job", { job_id: jobId });
      toast({ title: "Job Completed", description: `Subcontract job ${res.id} marked as completed.` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to Complete Job", description: err.message || "Error", variant: "destructive" });
    } finally {
      setActingJobId(null);
    }
  };

  // Metrics Calculations
  const totalAgreedCost = jobs.reduce((acc, j) => acc + (parseFloat(j.agreed_cost) || 0), 0);
  const totalClientRevenue = jobs.reduce((acc, j) => acc + (parseFloat(j.client_price) || 0), 0);
  const totalExpectedMargin = jobs.reduce((acc, j) => acc + (parseFloat(j.expected_margin) || 0), 0);
  const avgMarginPct = totalClientRevenue > 0 ? (totalExpectedMargin / totalClientRevenue) * 100 : 0;
  const activeSubCount = jobs.filter((j) => ["offered", "accepted", "in_progress"].includes(j.status)).length;

  const statusVariant = (status: string) => {
    switch (status) {
      case "accepted":
      case "completed":
        return "success";
      case "in_progress":
        return "brand";
      case "offered":
        return "warning";
      case "declined":
      case "cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton width="260px" height="2.5rem" />
        <Skeleton height="100px" />
        <Skeleton height="350px" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Subcontractors & Partners"
        description="Manage partner entertainment companies, issue sub-out work orders, track job acceptance, and monitor profit margins."
        badge={<Badge variant="outline">{jobs.length} Subcontracts</Badge>}
        actions={
          <Button
            onClick={() => {
              setSelectedPartnerForSub(null);
              setSubModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Sub Out Job
          </Button>
        }
      />

      {/* Top Margin & Performance Metric Cards */}
      <StatGrid>
        <MetricCard
          label="Active Subcontracts"
          value={activeSubCount}
          icon={<Clock className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          label="Subbed Client Revenue"
          value={`$${totalClientRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="Subcontractor Payout Cost"
          value={`$${totalAgreedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Handshake className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          label="Retained Gross Margin"
          value={`$${totalExpectedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${avgMarginPct.toFixed(1)}%)`}
          icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        />
      </StatGrid>

      {/* Workspace Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "jobs", label: `Active & Subbed Jobs (${jobs.length})` },
          { id: "directory", label: `Partner Directory (${partners.length})` },
          { id: "analytics", label: "Margin Analytics" }
        ]}
      />

      {/* TAB 1: Subcontract Jobs Table */}
      {activeTab === "jobs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Subcontract Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <EmptyState
                icon={<Handshake className="w-10 h-10 text-slate-400" />}
                title="No Subcontract Jobs Yet"
                description="Sub out an overflow booking or service line to a qualified partner company."
                action={
                  <Button onClick={() => setSubModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Sub Out First Job
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={[
                  {
                    header: "Job ID",
                    accessorKey: "id",
                    cell: (row: any) => (
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.id}
                      </div>
                    )
                  },
                  {
                    header: "Booking & Event",
                    accessorKey: "booking",
                    cell: (row: any) => (
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {row.booking_title || row.booking}
                        </div>
                        <div className="text-xs text-slate-500">{row.event_date || "Date TBD"} • {row.venue_name || "Venue TBD"}</div>
                      </div>
                    )
                  },
                  {
                    header: "Partner Company",
                    accessorKey: "vendor_name",
                    cell: (row: any) => (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Handshake className="w-3.5 h-3.5 text-slate-400" />
                        {row.vendor_name || row.vendor}
                      </div>
                    )
                  },
                  {
                    header: "Status",
                    accessorKey: "status",
                    cell: (row: any) => (
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    )
                  },
                  {
                    header: "Agreed Payout",
                    accessorKey: "agreed_cost",
                    cell: (row: any) => (
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.agreed_cost_formatted || `$${row.agreed_cost}`}
                        </div>
                        <div className="text-xs text-slate-500">{row.pay_terms || "Due on Completion"}</div>
                      </div>
                    )
                  },
                  {
                    header: "Client Price & Margin",
                    accessorKey: "expected_margin",
                    cell: (row: any) => (
                      <div>
                        <div className="text-xs text-slate-500">
                          Client: {row.client_price_formatted || `$${row.client_price}`}
                        </div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          +{row.expected_margin_formatted || `$${row.expected_margin}`} ({parseFloat(row.margin_percent || 0).toFixed(1)}%)
                        </div>
                      </div>
                    )
                  },
                  {
                    header: "Actions",
                    id: "actions",
                    cell: (row: any) => (
                      <div className="flex items-center gap-1.5">
                        {row.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendOffer(row.id)}
                            disabled={actingJobId === row.id}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send Offer
                          </Button>
                        )}
                        {["offered", "accepted"].includes(row.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteJob(row.id)}
                            disabled={actingJobId === row.id}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Done
                          </Button>
                        )}
                        {row.offer_token && (
                          <a
                            href={`/api/method/entertainment_express.api.subcontractors.get_subcontract_offer?token=${row.offer_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center p-1"
                            title="Inspect Token Packet"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )
                  }
                ]}
                data={jobs}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Subcontractor Partner Directory */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<Handshake className="w-10 h-10 text-slate-400" />}
                title="No Subcontractor Partners Qualified"
                description="Register partner entertainment companies and mark them as overflow subcontractors in your vendor network."
              />
            </div>
          ) : (
            partners.map((partner) => (
              <Card key={partner.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{partner.name}</CardTitle>
                      <div className="text-xs text-slate-500">{partner.category || "Entertainment Partner"}</div>
                    </div>
                    {partner.rating > 0 && (
                      <Badge variant="brand">★ {partner.rating.toFixed(1)}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Compliance Badges */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {partner.coi_on_file ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> COI Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="w-3.5 h-3.5" /> No COI
                      </span>
                    )}

                    {partner.w9_on_file ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> W-9 on File
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        W-9 Missing
                      </span>
                    )}
                  </div>

                  {/* Payment Terms & Contacts */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-md">
                    <div>Terms: <span className="font-medium text-slate-800 dark:text-slate-200">{partner.default_pay_terms || "Net 15"}</span></div>
                    {partner.contacts?.[0] && (
                      <div>
                        Contact: {partner.contacts[0].name} ({partner.contacts[0].phone || partner.contacts[0].email})
                      </div>
                    )}
                  </div>

                  {/* Sub Out Action */}
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      setSelectedPartnerForSub(partner);
                      setSubModalOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Sub Out Job to {partner.name.split(" ")[0]}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Margin Analytics */}
      {activeTab === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Subcontractor Margin & Profit Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 font-medium">Gross Subbed Inflow</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ${totalClientRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Total booked revenue subbed out</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 font-medium">Partner Payout Outflow</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ${totalAgreedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Agreed subcontractor compensation</div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Retained Profit</div>
                <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                  ${totalExpectedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{avgMarginPct.toFixed(1)}% average gross margin retained</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2">
              All margin arithmetic is enforced server-side using currency-precision <code className="text-primary font-mono">flt</code> calculations, guaranteeing isolation and preventing floating-point drift across fiscal quarters.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub Out Modal */}
      <SubOutModal
        open={subModalOpen}
        onOpenChange={setSubModalOpen}
        booking={null}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
export default SubcontractorsPage;
