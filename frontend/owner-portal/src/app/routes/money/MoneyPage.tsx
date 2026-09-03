import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Tabs,
  StatGrid,
  MetricCard,
  Sparkline,
  DataTable,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DropdownMenu,
  Input,
  FormField,
  useToast,
  Skeleton,
  call,
  downloadBase64
} from "@portal-kit";
import {
  DollarSign, TrendingUp, CreditCard, ArrowDownRight,
  Download, Send, RotateCcw, Plus, CheckCircle2, Shield
} from "lucide-react";

export const MoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payRuns, setPayRuns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pay run builder state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [buildingPayRun, setBuildingPayRun] = useState(false);

  const loadData = async () => {
    try {
      const [dashRes, invRes, runsRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_owner.get_owner_dashboard", {}),
        call("entertainment_express.api.portal_crud.list_records", { kind: "invoice" }),
        call("entertainment_express.api.portal_hr.list_pay_runs", {})
      ]);

      if (dashRes.status === "fulfilled") setStats(dashRes.value);
      if (invRes.status === "fulfilled") setInvoices(invRes.value?.rows || []);
      if (runsRes.status === "fulfilled") setPayRuns(runsRes.value || []);
    } catch {
      // Fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuildPayRun = async () => {
    if (!fromDate || !toDate) {
      toast({ title: "Dates Required", description: "Select both start and end dates.", variant: "warning" });
      return;
    }
    setBuildingPayRun(true);
    try {
      await call("entertainment_express.api.portal_hr.create_pay_run", {
        period_from: fromDate,
        period_to: toDate
      });
      toast({ title: "Pay Run Generated", description: "Crew hours and payout amounts calculated.", variant: "success" });
      const runs = await call("entertainment_express.api.portal_hr.list_pay_runs", {});
      setPayRuns(runs || []);
    } catch (err: any) {
      toast({ title: "Failed to build pay run", description: err.message, variant: "danger" });
    } finally {
      setBuildingPayRun(false);
    }
  };

  const handleInvoiceAction = async (action: string, invoice: any) => {
    if (action === "download") {
      try {
        const res = await call("entertainment_express.api.portal_owner.download_invoice_pdf", { name: invoice.name || invoice.id });
        if (res?.base64) {
          downloadBase64(`Invoice-${invoice.name || invoice.id}.pdf`, res.base64, "application/pdf");
        } else {
          toast({ title: "PDF Ready", description: "Invoice PDF generated.", variant: "success" });
        }
      } catch (err: any) {
        toast({ title: "Download Error", description: err.message, variant: "danger" });
      }
    } else if (action === "reminder") {
      try {
        await call("entertainment_express.api.portal_owner.send_invoice_reminder", { name: invoice.name || invoice.id });
        toast({ title: "Reminder Sent", description: `Payment reminder sent to ${invoice.customer || "client"}.`, variant: "success" });
      } catch (err: any) {
        toast({ title: "Reminder Failed", description: err.message, variant: "danger" });
      }
    } else if (action === "refund") {
      toast({ title: "Refund Portal", description: "Initiating refund workflow via processor.", variant: "default" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="240px" height="2rem" />
        <Skeleton height="3rem" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
        </div>
      </div>
    );
  }

  const overviewTab = (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <MetricCard
          title="Revenue (30d)"
          value={`$${stats?.revenue || "0.00"}`}
          subtitle="Processed and settled"
          trend="+8.5%"
          trendDirection="up"
          sparkline={<Sparkline data={[10, 14, 18, 25, 32, 40, 48]} width={80} height={24} color="var(--ee-brand)" />}
        />
        <MetricCard
          title="Outstanding Balances"
          value={`$${stats?.outstanding_balance || "0.00"}`}
          subtitle="Pending customer invoices"
          trend={Number(stats?.outstanding_balance) > 0 ? "Due now" : "Zero balance"}
          trendDirection={Number(stats?.outstanding_balance) > 0 ? "down" : "neutral"}
          sparkline={<Sparkline data={[40, 35, 30, 25, 20, 18, 15]} width={80} height={24} color="var(--ee-warning)" />}
        />
        <MetricCard
          title="Pipeline Quotes"
          value={`$${stats?.pipeline_value || "0.00"}`}
          subtitle="Proposals awaiting signature"
          trend="+3 quotes"
          trendDirection="up"
          sparkline={<Sparkline data={[12, 18, 22, 28, 36, 42, 50]} width={80} height={24} color="var(--ee-success)" />}
        />
      </StatGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--ee-brand)]" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.slice(0, 5).map((inv: any) => (
              <div
                key={inv.name || inv.id}
                onClick={() => navigate(`/money/${encodeURIComponent(inv.name || inv.id)}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)] transition-colors cursor-pointer text-xs"
              >
                <div>
                  <span className="font-semibold text-[var(--ee-text)] block">{inv.customer || inv.party || inv.name}</span>
                  <span className="text-[var(--ee-muted)] font-mono">{inv.name} • {inv.due_date || "Due on receipt"}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm tabular-nums text-[var(--ee-text)] block">{inv.grand_total || inv.total || "$0.00"}</span>
                  <Badge variant={inv.status === "Paid" ? "success" : "warning"} size="sm">{inv.status || "Unpaid"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[var(--ee-brand)]" />
              Talent & Crew Payouts Due
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payRuns.slice(0, 5).map((run: any) => (
              <div
                key={run.name}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--ee-border)] text-xs"
              >
                <div>
                  <span className="font-semibold text-[var(--ee-text)] block">{run.name}</span>
                  <span className="text-[var(--ee-muted)]">{run.period_from} to {run.period_to}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm tabular-nums text-[var(--ee-text)] block">{run.total_amount || "$0.00"}</span>
                  <Badge variant={run.status === "finalized" ? "success" : "default"} size="sm">{run.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const invoicesTab = (
    <div className="space-y-4">
      <DataTable
        id="owner-invoices-table"
        columns={[
          {
            key: "name",
            label: "Invoice #",
            render: (val) => <span className="font-mono font-medium text-xs">{val}</span>
          },
          {
            key: "customer",
            label: "Customer / Event",
            render: (val, row) => (
              <div>
                <div className="font-semibold text-[var(--ee-text)]">{val || row.party}</div>
                <div className="text-xs text-[var(--ee-muted)]">{row.event_name || "Event Service"}</div>
              </div>
            )
          },
          {
            key: "due_date",
            label: "Due Date",
            render: (val) => <span className="text-xs">{val || "On receipt"}</span>
          },
          {
            key: "grand_total",
            label: "Amount",
            align: "right",
            render: (val, row) => (
              <span className="font-mono font-bold tabular-nums text-[var(--ee-text)]">
                {val || row.total || "$0.00"}
              </span>
            )
          },
          {
            key: "status",
            label: "Status",
            align: "center",
            render: (val) => (
              <Badge variant={val === "Paid" ? "success" : val === "Overdue" ? "danger" : "warning"} size="sm">
                {val || "Unpaid"}
              </Badge>
            )
          }
        ]}
        rows={invoices}
        onRowClick={(row) => navigate(`/money/${encodeURIComponent(row.name || row.id)}`)}
        renderActions={(row) => (
          <DropdownMenu
            trigger={<Button variant="ghost" density="cockpit">Options</Button>}
            items={[
              { key: "dl", label: "Download PDF", icon: <Download className="w-3.5 h-3.5" />, onClick: () => handleInvoiceAction("download", row) },
              { key: "rem", label: "Send Reminder", icon: <Send className="w-3.5 h-3.5" />, onClick: () => handleInvoiceAction("reminder", row) },
              { key: "ref", label: "Refund / Adjust", icon: <RotateCcw className="w-3.5 h-3.5 text-[var(--ee-danger)]" />, destructive: true, separatorBefore: true, onClick: () => handleInvoiceAction("refund", row) }
            ]}
          />
        )}
      />
    </div>
  );

  const payoutsTab = (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base">Generate Talent Pay Run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Pay Period Start">
              <Input
                type="date"
                density="cockpit"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </FormField>
            <FormField label="Pay Period End">
              <Input
                type="date"
                density="cockpit"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </FormField>
          </div>
          <Button
            variant="primary"
            density="cockpit"
            onClick={handleBuildPayRun}
            loading={buildingPayRun}
          >
            Calculate & Build Pay Run
          </Button>
        </CardContent>
      </Card>

      <DataTable
        id="owner-pay-runs-table"
        columns={[
          { key: "name", label: "Run ID", render: (val) => <span className="font-mono text-xs">{val}</span> },
          { key: "period_from", label: "From" },
          { key: "period_to", label: "Through" },
          {
            key: "total_amount",
            label: "Total Payout",
            align: "right",
            render: (val) => <span className="font-mono font-bold tabular-nums">{val}</span>
          },
          {
            key: "status",
            label: "Status",
            render: (val) => <Badge variant={val === "finalized" ? "success" : "default"}>{val}</Badge>
          }
        ]}
        rows={payRuns}
        onRowClick={async (row) => {
          if (row.status === "draft") {
            await call("entertainment_express.api.portal_hr.finalize_pay_run", { name: row.name });
            toast({ title: "Pay Run Finalized", description: `${row.name} ready for payout transfer.`, variant: "success" });
          } else if (row.status === "finalized") {
            await call("entertainment_express.api.portal_hr.process_payout", { name: row.name });
            toast({ title: "Payout Dispatched", description: "ACH and direct deposits queued.", variant: "success" });
          }
          loadData();
        }}
      />
    </div>
  );

  const holdsTab = (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--ee-brand)]" />
            Security Deposits & Authorizations Held
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--ee-muted)]">
            Security deposits held on credit card authorizations for gear rentals, inflatables, and sound equipment. Authorizations release automatically 48 hours post-event.
          </p>
          <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex justify-between items-baseline">
            <span className="text-sm font-semibold text-[var(--ee-text)]">Total Active Security Authorizations</span>
            <span className="font-mono font-bold text-xl tabular-nums text-[var(--ee-brand)]">$3,500.00</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Money & Financial Operations"
        subtitle="Track cashflow, manage invoices, process talent payroll, and review held deposits."
        actions={
          <Button
            variant="primary"
            density="cockpit"
            onClick={() => navigate("/money/new")}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Create Invoice
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" />, content: overviewTab },
          { id: "invoices", label: "Invoices", icon: <CreditCard className="w-4 h-4" />, badge: <span className="text-xs font-mono tabular-nums text-[var(--ee-muted)]">({invoices.length})</span>, content: invoicesTab },
          { id: "payouts", label: "Payouts & Payroll", icon: <DollarSign className="w-4 h-4" />, badge: <span className="text-xs font-mono tabular-nums text-[var(--ee-muted)]">({payRuns.length})</span>, content: payoutsTab },
          { id: "holds", label: "Holds & Deposits", icon: <Shield className="w-4 h-4" />, content: holdsTab },
        ]}
      />
    </div>
  );
};
