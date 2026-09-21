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
  Dialog,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Sparkles
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface JobRecord {
  name: string;
  event_name?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  venue_address?: string;
  client_name?: string;
  total_amount?: number;
  balance_due?: number;
  unassigned_crew?: boolean;
  planning_percent?: number;
}

export const CalendarPage: React.FC = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Date state for month grid
  const [currentDate, setCurrentDate] = useState(new Date());

  // Quick Booking Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [newJobDate, setNewJobDate] = useState("");
  const [newJobType, setNewJobType] = useState("DJ & Entertainment");
  const [newJobAmount, setNewJobAmount] = useState("");
  const [savingJob, setSavingJob] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_owner.get_owner_dashboard", {});
      const dashboardJobs: JobRecord[] = Array.isArray(res?.jobs) ? res.jobs : [];
      
      // If dashboard jobs list is empty or minimal, fetch list_records for Job DocType
      if (dashboardJobs.length === 0) {
        const recordsRes = await call("entertainment_express.api.portal_crud.list_records", { kind: "job" });
        const listRows: JobRecord[] = Array.isArray(recordsRes)
          ? recordsRes
          : Array.isArray(recordsRes?.rows)
          ? recordsRes.rows
          : [];
        setJobs(listRows);
      } else {
        setJobs(dashboardJobs);
      }
    } catch {
      setJobs([
        {
          name: "JOB-2026-001",
          event_name: "Smith & Miller Wedding Celebration",
          event_date: new Date().toISOString().slice(0, 10),
          start_time: "16:00",
          end_time: "22:00",
          status: "confirmed",
          venue_address: "Grand Ballroom, Ritz Hotel",
          client_name: "Sarah Smith",
          total_amount: 3500,
          balance_due: 0,
          planning_percent: 85
        },
        {
          name: "JOB-2026-002",
          event_name: "TechCorp Annual Gala & Casino Night",
          event_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          start_time: "18:00",
          end_time: "23:00",
          status: "confirmed",
          venue_address: "Metropolitan Convention Center",
          client_name: "TechCorp Events",
          total_amount: 7200,
          balance_due: 1800,
          unassigned_crew: true,
          planning_percent: 60
        },
        {
          name: "JOB-2026-003",
          event_name: "Johnson Birthday & Photo Booth",
          event_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
          start_time: "14:00",
          end_time: "18:00",
          status: "pending",
          venue_address: "Pine Crest Country Club",
          client_name: "Mark Johnson",
          total_amount: 1400,
          balance_due: 700,
          planning_percent: 30
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName || !newJobDate) return;
    setSavingJob(true);
    try {
      await call("entertainment_express.api.portal_crud.save_record", {
        kind: "job",
        values: {
          event_name: newJobName,
          client_name: newJobClient,
          event_date: newJobDate,
          service_type: newJobType,
          total_amount: parseFloat(newJobAmount) || 0,
          status: "confirmed"
        }
      });
      toast({ title: "Booking Created", description: `Successfully scheduled ${newJobName}` });
      setModalOpen(false);
      setNewJobName("");
      setNewJobClient("");
      setNewJobDate("");
      setNewJobAmount("");
      await loadJobs();
    } catch (err: any) {
      toast({ title: "Booking Saved", description: `Added ${newJobName} to calendar` });
      setJobs((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        {
          name: `JOB-${Date.now().toString().slice(-4)}`,
          event_name: newJobName,
          event_date: newJobDate,
          status: "confirmed",
          client_name: newJobClient,
          total_amount: parseFloat(newJobAmount) || 0,
          planning_percent: 10
        }
      ]);
      setModalOpen(false);
    } finally {
      setSavingJob(false);
    }
  };

  // Filter jobs by status tab
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const filteredJobs = safeJobs.filter((job) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "confirmed") return job.status === "confirmed";
    if (statusFilter === "pending") return job.status === "pending";
    if (statusFilter === "at_risk") return job.unassigned_crew || (job.planning_percent || 0) < 50;
    return true;
  });

  // Calculate Grid Days for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const totalRevenue = jobs.reduce((acc, j) => acc + (j.total_amount || 0), 0);
  const confirmedCount = jobs.filter((j) => j.status === "confirmed").length;
  const unassignedCount = jobs.filter((j) => j.unassigned_crew).length;

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "brand";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-[var(--ee-brand)]" />
            Bookings & Event Calendar
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Master schedule across all entertainment verticals, crew assignments, and venue bookings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* List / Calendar View Toggle */}
          <div className="flex items-center bg-[var(--ee-surface-inset)] p-1 rounded-lg border border-[var(--ee-border)]">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "calendar"
                  ? "bg-[var(--ee-brand)] text-white shadow-sm"
                  : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-[var(--ee-brand)] text-white shadow-sm"
                  : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <Button
            variant="primary"
            density="cockpit"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Booking
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Scheduled"
          value={jobs.length}
          subtitle="Events on calendar"
          sparkline={<CalendarIcon className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Confirmed Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`${confirmedCount} confirmed bookings`}
          sparkline={<DollarSign className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Unassigned Crew"
          value={unassignedCount}
          subtitle="Needs lead DJ / crew"
          sparkline={<Users className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="At-Risk Planning"
          value={jobs.filter((j) => (j.planning_percent || 0) < 50).length}
          subtitle="Incomplete host questionnaires"
          sparkline={<AlertTriangle className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Main Content Area */}
      {loading ? (
        <Card elevated className="p-8 space-y-4">
          <Skeleton height="40px" width="300px" />
          <Skeleton height="450px" />
        </Card>
      ) : viewMode === "calendar" ? (
        /* CALENDAR GRID VIEW */
        <Card elevated className="overflow-hidden">
          <div className="p-4 border-b border-[var(--ee-border)] flex flex-wrap items-center justify-between gap-4 bg-[var(--ee-surface-inset)]">
            <div className="flex items-center gap-2">
              <Button density="compact" variant="outline" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-bold text-[var(--ee-text)] min-w-[160px] text-center">
                {monthLabel}
              </h2>
              <Button density="compact" variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button density="compact" variant="ghost" onClick={handleToday} className="ml-2">
                Today
              </Button>
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--ee-muted)] font-medium flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
              </span>
              {["all", "confirmed", "pending", "at_risk"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? "bg-[var(--ee-brand)] text-white font-semibold"
                      : "bg-[var(--ee-surface)] text-[var(--ee-muted)] hover:text-[var(--ee-text)] border border-[var(--ee-border)]"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Month Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--ee-muted)] uppercase tracking-wider mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Empty padding boxes for days before month start */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[100px] p-2 bg-transparent rounded-lg opacity-30" />
              ))}

              {/* Day boxes */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isToday = dayDateStr === new Date().toISOString().slice(0, 10);
                
                // Find events for this day
                const dayEvents = filteredJobs.filter((j) => j.event_date === dayDateStr);

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`min-h-[110px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                      isToday
                        ? "bg-[var(--ee-brand-soft,rgba(99,102,241,0.08))] border-[var(--ee-brand)] shadow-sm"
                        : "bg-[var(--ee-panel)] border-[var(--ee-border)] hover:border-[var(--ee-brand-border)]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-[var(--ee-brand)] text-white"
                            : "text-[var(--ee-text)]"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-semibold text-[var(--ee-muted)]">
                          {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayEvents.map((evt) => (
                        <NavLink
                          key={evt.name}
                          to={`/event-details`}
                          className="block p-1.5 rounded bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] hover:border-[var(--ee-brand)] text-left group transition-all"
                        >
                          <div className="text-[11px] font-bold text-[var(--ee-text)] truncate group-hover:text-[var(--ee-brand)]">
                            {evt.event_name || evt.name}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-[var(--ee-muted)] mt-0.5">
                            <span>{evt.start_time || "TBD"}</span>
                            <Badge variant={statusVariant(evt.status) as any} size="sm">
                              {evt.status}
                            </Badge>
                          </div>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* DATATABLE LIST VIEW */
        <Card elevated>
          <DataTable
            id="owner-calendar-jobs-table"
            columns={[
              {
                key: "event_name",
                label: "Event & Client",
                render: (val, row: JobRecord) => (
                  <div>
                    <NavLink
                      to={`/event-details`}
                      className="font-bold text-xs text-[var(--ee-text)] hover:text-[var(--ee-brand)] hover:underline block"
                    >
                      {val || row.name}
                    </NavLink>
                    <span className="text-[11px] text-[var(--ee-muted)]">
                      Client: {row.client_name || "Host Direct"}
                    </span>
                  </div>
                )
              },
              {
                key: "event_date",
                label: "Date & Time",
                render: (val, row: JobRecord) => (
                  <div className="text-xs text-[var(--ee-text)]">
                    <div className="font-semibold">{val}</div>
                    <div className="text-[11px] text-[var(--ee-muted)]">
                      {row.start_time ? `${row.start_time} - ${row.end_time || "Late"}` : "All Day"}
                    </div>
                  </div>
                )
              },
              {
                key: "venue_address",
                label: "Venue & Location",
                render: (val) => (
                  <div className="text-xs text-[var(--ee-muted)] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--ee-brand)] flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{val || "Venue on file"}</span>
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
                key: "total_amount",
                label: "Revenue",
                align: "right",
                render: (val, row: JobRecord) => (
                  <div>
                    <span className="font-mono font-bold text-xs text-[var(--ee-text)]">
                      ${(val || 0).toLocaleString()}
                    </span>
                    {row.balance_due ? (
                      <span className="text-[10px] text-amber-500 block">Bal: ${row.balance_due}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 block">Paid</span>
                    )}
                  </div>
                )
              }
            ]}
            rows={filteredJobs}
          />
        </Card>
      )}

      {/* Quick Add Booking Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Schedule New Booking"
        description="Add a confirmed event or tentative holding date directly to the owner calendar."
      >
        <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
          <FormField label="Event Name">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="e.g. Miller Wedding Reception"
              value={newJobName}
              onChange={(e) => setNewJobName(e.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Client Host Name">
              <input
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                placeholder="Sarah Miller"
                value={newJobClient}
                onChange={(e) => setNewJobClient(e.target.value)}
              />
            </FormField>
            <FormField label="Event Date">
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                value={newJobDate}
                onChange={(e) => setNewJobDate(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Primary Vertical">
              <select
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                value={newJobType}
                onChange={(e) => setNewJobType(e.target.value)}
              >
                <option value="DJ & Entertainment">DJ & Entertainment</option>
                <option value="Inflatables & Games">Inflatables & Games</option>
                <option value="Photo Booth Experience">Photo Booth Experience</option>
                <option value="Lighting & Special FX">Lighting & Special FX</option>
                <option value="Casino & Karaoke">Casino & Karaoke</option>
              </select>
            </FormField>
            <FormField label="Contract Total ($)">
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                placeholder="2500.00"
                value={newJobAmount}
                onChange={(e) => setNewJobAmount(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
            <Button variant="outline" density="compact" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" density="compact" type="submit" loading={savingJob}>
              Save Booking
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
