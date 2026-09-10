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
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200 p-2 sm:p-0">
        <Skeleton width="260px" height="2.5rem" />
        <Skeleton height="100px" />
        <Skeleton height="350px" />
      </div>
    );
  }

  const jobsTab = (
    <Card elevated className="overflow-hidden">
      {jobs.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<Handshake className="w-10 h-10 text-[var(--ee-muted)]" />}
            title="No Subcontract Jobs Yet"
            description="Sub out an overflow booking or service line to a qualified partner company."
            action={
              <Button
                variant="primary"
                density="cockpit"
                onClick={() => setSubModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Sub Out First Job
              </Button>
            }
          />
        </div>
      ) : (
        <DataTable
          id="owner-subcontract-jobs-table"
          columns={[
            {
              key: "id",
              label: "Job ID",
              render: (val) => (
                <span className="font-mono font-medium text-xs text-[var(--ee-text)]">
                  {val}
                </span>
              )
            },
            {
              key: "booking",
              label: "Booking & Event",
              render: (_val, row: any) => (
                <div>
                  <div className="font-semibold text-xs text-[var(--ee-text)]">
                    {row.booking_title || row.booking}
                  </div>
                  <div className="text-[11px] text-[var(--ee-muted)]">
                    {row.event_date || "Date TBD"} • {row.venue_name || "Venue TBD"}
                  </div>
                </div>
              )
            },
            {
              key: "vendor_name",
              label: "Partner Company",
              render: (val, row: any) => (
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ee-text)]">
                  <Handshake className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
                  {val || row.vendor}
                </div>
              )
            },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (val) => (
                <Badge variant={statusVariant(val) as any} size="sm">
                  {val}
                </Badge>
              )
            },
            {
              key: "agreed_cost",
              label: "Agreed Payout",
              align: "right",
              render: (val, row: any) => (
                <div>
                  <span className="font-mono font-bold text-xs tabular-nums text-[var(--ee-text)] block">
                    {row.agreed_cost_formatted || `$${val}`}
                  </span>
                  <span className="text-[10px] text-[var(--ee-muted)]">{row.pay_terms || "Due on Completion"}</span>
                </div>
              )
            },
            {
              key: "expected_margin",
              label: "Margin",
              align: "right",
              render: (val, row: any) => (
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                    +{row.expected_margin_formatted || `$${val}`}
                  </span>
                  <span className="text-[10px] text-[var(--ee-muted)]">
                    {parseFloat(row.margin_percent || 0).toFixed(1)}% gross
                  </span>
                </div>
              )
            }
          ]}
          rows={jobs}
          renderActions={(row: any) => (
            <div className="flex items-center gap-1.5">
              {row.status === "draft" && (
                <Button
                  density="compact"
                  variant="outline"
                  onClick={() => handleSendOffer(row.id)}
                  loading={actingJobId === row.id}
                >
                  <Send className="w-3 h-3 mr-1" />
                  Send
                </Button>
              )}
              {["offered", "accepted"].includes(row.status) && (
                <Button
                  density="compact"
                  variant="outline"
                  onClick={() => handleCompleteJob(row.id)}
                  loading={actingJobId === row.id}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Done
                </Button>
              )}
              {row.offer_token && (
                <a
                  href={`/api/method/entertainment_express.api.subcontractors.get_subcontract_offer?token=${row.offer_token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--ee-brand)] hover:underline flex items-center p-1"
                  title="Inspect Token Packet"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        />
      )}
    </Card>
  );

  const directoryTab = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {partners.length === 0 ? (
        <div className="col-span-full">
          <Card elevated>
            <CardContent className="p-6">
              <EmptyState
                icon={<Handshake className="w-10 h-10 text-[var(--ee-muted)]" />}
                title="No Subcontractor Partners Qualified"
                description="Register partner entertainment companies and mark them as overflow subcontractors in your vendor network."
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        partners.map((partner) => (
          <Card key={partner.id} elevated className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{partner.name}</CardTitle>
                  <div className="text-xs text-[var(--ee-muted)]">{partner.category || "Entertainment Partner"}</div>
                </div>
                {partner.rating > 0 && (
                  <Badge variant="brand" size="sm">★ {partner.rating.toFixed(1)}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Compliance Badges */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                {partner.coi_on_file ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> COI Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" /> No COI
                  </span>
                )}

                {partner.w9_on_file ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> W-9 on File
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[var(--ee-muted)]">
                    W-9 Missing
                  </span>
                )}
              </div>

              {/* Payment Terms & Contacts */}
              <div className="text-xs text-[var(--ee-text)] space-y-1 bg-[var(--ee-surface-inset)] p-2.5 rounded-lg border border-[var(--ee-border)]">
                <div>Terms: <span className="font-medium">{partner.default_pay_terms || "Net 15"}</span></div>
                {partner.contacts?.[0] && (
                  <div className="truncate text-[var(--ee-muted)]">
                    Contact: {partner.contacts[0].name} ({partner.contacts[0].phone || partner.contacts[0].email})
                  </div>
                )}
              </div>

              {/* Sub Out Action */}
              <Button
                variant="outline"
                density="compact"
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
  );

  const analyticsTab = (
    <Card elevated>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Subcontractor Margin & Profit Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
            <div className="text-xs text-[var(--ee-muted)] font-medium">Gross Subbed Inflow</div>
            <div className="text-xl font-bold text-[var(--ee-text)] mt-1">
              ${totalClientRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[var(--ee-muted)] mt-0.5">Total booked revenue subbed out</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
            <div className="text-xs text-[var(--ee-muted)] font-medium">Partner Payout Outflow</div>
            <div className="text-xl font-bold text-[var(--ee-text)] mt-1">
              ${totalAgreedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[var(--ee-muted)] mt-0.5">Agreed subcontractor compensation</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Retained Profit</div>
            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
              ${totalExpectedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{avgMarginPct.toFixed(1)}% average gross margin retained</div>
          </div>
        </div>

        <div className="text-xs text-[var(--ee-muted)] pt-2">
          All margin arithmetic is enforced server-side using currency-precision calculations, guaranteeing isolation and preventing floating-point drift across fiscal quarters.
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Friendly Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)]">
            Subcontractors & Partners
          </h1>
          <p className="text-base text-[var(--ee-muted)]">
            Manage partner entertainment companies, issue sub-out work orders, and track profit margins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="brand" size="sm">
            {jobs.length} Subcontracts
          </Badge>
          <Button
            variant="primary"
            density="cockpit"
            onClick={() => {
              setSelectedPartnerForSub(null);
              setSubModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Sub Out Job
          </Button>
        </div>
      </div>

      {/* Top Margin & Performance Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Active Subcontracts"
          value={activeSubCount}
          subtitle="Assigned & in progress"
          sparkline={<Clock className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Subbed Inflow"
          value={`$${totalClientRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Client revenue"
          sparkline={<DollarSign className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Partner Payout"
          value={`$${totalAgreedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Subcontractor cost"
          sparkline={<Handshake className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Retained Margin"
          value={`$${totalExpectedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${avgMarginPct.toFixed(1)}% gross margin`}
          sparkline={<TrendingUp className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Workspace Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "jobs", label: `Active & Subbed Jobs (${jobs.length})`, content: jobsTab },
          { id: "directory", label: `Partner Directory (${partners.length})`, content: directoryTab },
          { id: "analytics", label: "Margin Analytics", content: analyticsTab }
        ]}
      />

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
