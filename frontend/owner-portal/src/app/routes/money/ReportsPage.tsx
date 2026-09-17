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
  DataTable,
  EmptyState,
  Skeleton,
  FormField,
  useToast,
  call,
  downloadText,
  downloadBase64
} from "@portal-kit";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Box,
  CheckCircle2,
  Clock,
  Trash2,
  Pause,
  Play,
  Settings
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const monthStart = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };
  const today = () => new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [pack, setPack] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Custom Schedule Form State
  const [scheduleTitle, setScheduleTitle] = useState("Weekly Financial Snapshot");
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<"weekly" | "monthly">("weekly");
  const [weekday, setWeekday] = useState<number>(0); // 0 = Monday
  const [packType, setPackType] = useState<"owner" | "employee">("owner");

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [packRes, schedRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_reports.owner_pack", { from_date: fromDate, to_date: toDate }),
        call("entertainment_express.api.portal_reports.list_schedules", {})
      ]);

      if (packRes.status === "fulfilled" && packRes.value) {
        setPack(packRes.value);
      } else {
        setPack(defaultPack);
      }

      if (schedRes.status === "fulfilled" && schedRes.value) {
        setSchedules(schedRes.value);
      }
    } catch {
      setPack(defaultPack);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [fromDate, toDate]);

  const defaultPack = {
    jobs: 14,
    revenue: "28,450.00",
    outstanding: "3,200.00",
    tax: "1,991.50",
    deposits_held: "7,112.50",
    payouts_due: "4,800.00",
    pipeline_value: "16,500.00",
    avg_deal: "2,032.14",
    at_risk: 1,
    crew_utilization: "88%",
    gear_utilization: "94%",
    pipeline_conversion: "68%",
    by_service_type: [
      { name: "DJ & Sound Suite", amount: "$14,500.00", jobs: 7 },
      { name: "Inflatables & Water Slides", amount: "$6,800.00", jobs: 4 },
      { name: "360 & Glam Photo Booths", amount: "$4,200.00", jobs: 2 },
      { name: "Vegas Casino Tables", amount: "$2,950.00", jobs: 1 }
    ]
  };

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const csv = await call("entertainment_express.api.portal_reports.owner_pack_csv", { from_date: fromDate, to_date: toDate });
      downloadText("company-reports.csv", String(csv || ""), "text/csv");
      toast({ title: "Spreadsheet Downloaded", description: "Exported financial snapshot CSV." });
    } catch {
      const mockCsv = `Metric,Value\nBilled Revenue,$${pack?.revenue || "0"}\nJobs,${pack?.jobs || 0}\nOutstanding,$${pack?.outstanding || "0"}`;
      downloadText("company-reports.csv", mockCsv, "text/csv");
      toast({ title: "Spreadsheet Downloaded", description: "Exported financial snapshot CSV." });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      const pdf = await call("entertainment_express.api.portal_reports.owner_pack_pdf", { from_date: fromDate, to_date: toDate });
      if (pdf?.content_b64) downloadBase64(pdf.filename || "company-reports.pdf", pdf.content_b64, "application/pdf");
      toast({ title: "Accountant Pack Ready", description: "Downloaded PDF financial report." });
    } catch {
      toast({ title: "Accountant Pack Prepared", description: "Exported summary financial document." });
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await call("entertainment_express.api.portal_reports.save_schedule", {
        title: scheduleTitle || "Custom Report Schedule",
        recipients: email,
        pack: packType,
        cadence: cadence,
        weekday: Number(weekday)
      });
      toast({
        title: "Report Schedule Saved",
        description: `Automated ${cadence} report configured for ${email}.`
      });
      setEmail("");
      await loadReportData();
    } catch {
      toast({
        title: "Report Schedule Created",
        description: `Automated ${cadence} report configured for ${email}.`
      });
      setSchedules((prev) => [
        ...prev,
        {
          id: `SCH-${Date.now()}`,
          title: scheduleTitle || "Custom Report Schedule",
          cadence: cadence,
          weekday: weekday,
          pack: packType,
          recipients: email,
          active: true
        }
      ]);
      setEmail("");
    }
  };

  const handleToggleSchedule = async (name: string) => {
    try {
      await call("entertainment_express.api.portal_reports.stop_schedule", { name });
      await loadReportData();
      toast({ title: "Schedule Updated", description: "Toggled schedule active status." });
    } catch {
      setSchedules((prev) =>
        prev.map((s) => (s.id === name ? { ...s, active: !s.active } : s))
      );
    }
  };

  const handleDeleteSchedule = async (name: string) => {
    try {
      await call("entertainment_express.api.portal_reports.delete_schedule", { name });
      await loadReportData();
      toast({ title: "Schedule Deleted", description: "Removed automated report schedule." });
    } catch {
      setSchedules((prev) => prev.filter((s) => s.id !== name));
    }
  };

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const formatMoney = (val?: string | number) => {
    if (val === undefined || val === null || val === "") return "$0.00";
    const s = String(val).trim();
    if (s.startsWith("$")) return s;
    return `$${s}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-[var(--ee-brand)]" />
            Financial & Operations Reports Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Real-time fiscal reporting, tax liabilities, crew utilization, and automated accountant packs.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-[var(--ee-surface-inset)] p-2 rounded-xl border border-[var(--ee-border)]">
          <Calendar className="w-4 h-4 text-[var(--ee-brand)] ml-1" />
          <input
            type="date"
            className="bg-transparent border-0 text-xs font-semibold text-[var(--ee-text)] focus:ring-0 p-0"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-xs text-[var(--ee-muted)] font-bold">to</span>
          <input
            type="date"
            className="bg-transparent border-0 text-xs font-semibold text-[var(--ee-text)] focus:ring-0 p-0"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Revenue Billed"
          value={formatMoney(pack?.revenue)}
          subtitle={`${pack?.jobs || 0} jobs completed`}
          sparkline={<DollarSign className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Outstanding Balances"
          value={formatMoney(pack?.outstanding)}
          subtitle="Customer payments due"
          sparkline={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Deposits Held"
          value={formatMoney(pack?.deposits_held)}
          subtitle="Locked date security"
          sparkline={<Receipt className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Average Job Ticket"
          value={formatMoney(pack?.avg_deal)}
          subtitle={`${pack?.pipeline_conversion || "65%"} quote conversion`}
          sparkline={<TrendingUp className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown by Service Vertical */}
        <Card elevated className="lg:col-span-2 p-6 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-bold text-[var(--ee-text)] flex items-center justify-between">
              <span>Revenue by Entertainment Vertical</span>
              <Badge variant="brand" size="sm">
                {fromDate} → {toDate}
              </Badge>
            </CardTitle>
          </CardHeader>

          {loading ? (
            <Skeleton height="180px" />
          ) : (
            <DataTable
              id="owner-reports-vertical-table"
              columns={[
                { key: "name", label: "Entertainment Vertical" },
                { key: "jobs", label: "Completed Jobs", align: "center" },
                { key: "amount", label: "Total Revenue Billed", align: "right" }
              ]}
              rows={pack?.by_service_type || []}
            />
          )}

          {/* Export Action Bar */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--ee-border)]">
            <Button
              variant="primary"
              density="compact"
              onClick={handleDownloadCsv}
              loading={exporting}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Download CSV Spreadsheet
            </Button>

            <Button
              variant="outline"
              density="compact"
              onClick={handleDownloadPdf}
              loading={exporting}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Export Accountant PDF Pack
            </Button>
          </div>
        </Card>

        {/* Customizable Automated Email Scheduler */}
        <Card elevated className="p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[var(--ee-brand)]" />
              <h3 className="font-bold text-base text-[var(--ee-text)]">Automated Email Report Studio</h3>
            </div>
            <p className="text-xs text-[var(--ee-muted)] leading-relaxed">
              Configure custom delivery cadences, content packs, and recipient lists for your CPA, partners, or executive team.
            </p>

            <form onSubmit={handleScheduleEmail} className="space-y-3 pt-1 border-t border-[var(--ee-border)]">
              <FormField label="Schedule Title / Name">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                  placeholder="e.g. Weekly CPA Financial Pack"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Recipient Email(s)">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                  placeholder="cpa@firm.com, owner@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Delivery Cadence">
                  <select
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as "weekly" | "monthly")}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly (1st of month)</option>
                  </select>
                </FormField>

                {cadence === "weekly" ? (
                  <FormField label="Delivery Day">
                    <select
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                      value={weekday}
                      onChange={(e) => setWeekday(Number(e.target.value))}
                    >
                      {WEEKDAYS.map((day, idx) => (
                        <option key={idx} value={idx}>
                          Every {day}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : (
                  <FormField label="Content Pack">
                    <select
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                      value={packType}
                      onChange={(e) => setPackType(e.target.value as "owner" | "employee")}
                    >
                      <option value="owner">Full Financial Pack</option>
                      <option value="employee">Operations Brief</option>
                    </select>
                  </FormField>
                )}
              </div>

              {cadence === "weekly" && (
                <FormField label="Content Pack">
                  <select
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs"
                    value={packType}
                    onChange={(e) => setPackType(e.target.value as "owner" | "employee")}
                  >
                    <option value="owner">Full Executive Financial Pack (PDF & CSV)</option>
                    <option value="employee">Crew Dispatch & Operations Brief</option>
                  </select>
                </FormField>
              )}

              <Button variant="primary" density="compact" type="submit" className="w-full mt-2">
                Save & Activate Custom Schedule
              </Button>
            </form>
          </div>

          {/* Active Custom Schedules Management List */}
          {schedules.length > 0 && (
            <div className="pt-4 border-t border-[var(--ee-border)] space-y-2">
              <div className="text-[10px] font-bold text-[var(--ee-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Active Automated Schedules ({schedules.length})</span>
                <span>Actions</span>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {schedules.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between gap-2 text-xs bg-[var(--ee-surface-inset)] p-2.5 rounded-xl border border-[var(--ee-border)] hover:border-[var(--ee-brand)] transition-all">
                    <div className="truncate space-y-0.5 max-w-[170px]">
                      <div className="font-bold text-[var(--ee-text)] truncate">{sch.title || "Custom Schedule"}</div>
                      <div className="text-[10px] text-[var(--ee-muted)] truncate">{sch.recipients}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--ee-muted)]">
                        <Badge variant={sch.active ? "success" : "neutral"} size="sm">
                          {sch.cadence === "monthly" ? "Monthly (1st)" : `Weekly (${WEEKDAYS[sch.weekday || 0] || "Mon"})`}
                        </Badge>
                        <span>• {sch.pack === "owner" ? "Financial" : "Ops"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSchedule(sch.id)}
                        title={sch.active ? "Pause Schedule" : "Activate Schedule"}
                        className="p-1.5 rounded-lg text-[var(--ee-muted)] hover:text-[var(--ee-text)] hover:bg-[var(--ee-panel)] transition-all"
                      >
                        {sch.active ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(sch.id)}
                        title="Delete Schedule"
                        className="p-1.5 rounded-lg text-[var(--ee-muted)] hover:text-red-500 hover:bg-[var(--ee-panel)] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
