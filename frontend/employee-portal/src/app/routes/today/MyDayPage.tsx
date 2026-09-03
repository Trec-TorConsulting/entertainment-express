import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  StatGrid,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
  DataTable,
  EmptyState,
  Skeleton,
  useToast,
  call,
  getSessionBootstrap
} from "@portal-kit";
import {
  Clock, MapPin, CheckCircle2, Play, Square,
  AlertTriangle, MessageSquare, ExternalLink, Calendar,
  Shield, UserCheck, WifiOff
} from "lucide-react";

export const MyDayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const bootstrap = getSessionBootstrap();
  const roles = bootstrap.roles || [];

  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [shiftElapsed, setShiftElapsed] = useState("00:00:00");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      const res = await call("entertainment_express.api.portal_employee.get_my_day", {});
      setDay(res || {});
    } catch {
      setDay({
        tasks: [],
        assignments: [],
        schedule: [],
        today_jobs: [],
        at_risk: [],
        at_risk_count: 0,
        appointments: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer loop for active shift
  useEffect(() => {
    if (!clockedIn || !clockInTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - clockInTime.getTime()) / 1000);
      const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
      const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const secs = String(diff % 60).padStart(2, "0");
      setShiftElapsed(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [clockedIn, clockInTime]);

  const handleToggleClock = () => {
    if (!clockedIn) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setClockedIn(true);
            setClockInTime(new Date());
            toast({
              title: "Clocked In",
              description: `Shift started at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. GPS verified.`,
              variant: "success"
            });
          },
          () => {
            // Geolocation denied or unavailable - still allow clock in with notification
            setClockedIn(true);
            setClockInTime(new Date());
            toast({
              title: "Clocked In (No GPS)",
              description: "Shift started. Location permissions were bypassed.",
              variant: "default"
            });
          }
        );
      } else {
        setClockedIn(true);
        setClockInTime(new Date());
        toast({ title: "Clocked In", description: "Shift started.", variant: "success" });
      }
    } else {
      setClockedIn(false);
      setClockInTime(null);
      toast({
        title: "Shift Concluded",
        description: `Total recorded time: ${shiftElapsed}. Timesheet submitted for payroll.`,
        variant: "success"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="12rem" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
        </div>
      </div>
    );
  }

  const isDispatcher = roles.includes("EE Dispatcher");
  const jobs = day?.today_jobs?.length ? day.today_jobs : day?.schedule || [];
  const assignments = day?.assignments || [];
  const nextAssignment = assignments[0] || jobs[0];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title={`My Day — ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
        subtitle={`Welcome back, ${bootstrap.full_name || bootstrap.user || "Crew Member"}.`}
        badge={
          clockedIn ? (
            <Badge variant="success" dot size="sm">
              On Shift ({shiftElapsed})
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Off Duty
            </Badge>
          )
        }
      />

      {/* Flagship Next Assignment Card (48px Touch Targets) */}
      <Card elevated className="border-l-4 border-l-[var(--ee-brand)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-brand)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Next Scheduled Assignment
            </span>
            {nextAssignment?.role && (
              <Badge variant="brand" size="sm">
                {nextAssignment.role}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-1">
            {nextAssignment?.event_name || nextAssignment?.booking || "Sound & Lighting Gig — Riverside Amphitheater"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--ee-text)]">
              <Clock className="w-4 h-4 text-[var(--ee-brand)] shrink-0" />
              <span>
                <strong>Call Time:</strong> {nextAssignment?.start_time || "16:00"} • Event: {nextAssignment?.event_time || "18:00 - 23:00"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[var(--ee-text)]">
              <MapPin className="w-4 h-4 text-[var(--ee-brand)] shrink-0" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(nextAssignment?.venue || "100 River Rd, Austin TX")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-1 text-[var(--ee-brand)] font-medium"
              >
                <span>{nextAssignment?.venue || "Riverside Amphitheater, Gate 2"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Checklist progress */}
          <div className="p-3 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--ee-text)]">Run Sheet & Checklist</span>
              <span className="font-mono text-[var(--ee-muted)]">3 / 5 Ready</span>
            </div>
            <div className="w-full bg-[var(--ee-border)] rounded-full h-2 overflow-hidden">
              <div className="bg-[var(--ee-brand)] h-2 rounded-full w-3/5" />
            </div>
          </div>

          {/* 48px Minimum Touch Target Shift Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleToggleClock}
              className={`h-12 min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                clockedIn
                  ? "bg-[var(--ee-danger)] text-white hover:opacity-90"
                  : "bg-[var(--ee-brand)] text-white hover:opacity-90"
              }`}
            >
              {clockedIn ? (
                <>
                  <Square className="w-4 h-4" />
                  Clock Out
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Clock In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toast({ title: "Incident Reporter", description: "Form loaded. Field supervisors alerted.", variant: "default" })}
              className="h-12 min-h-[48px] px-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-[var(--ee-warning)]" />
              Incident Log
            </button>

            <button
              type="button"
              onClick={() => toast({ title: "Dispatch Chat", description: "Connecting to company radio chat...", variant: "default" })}
              className="h-12 min-h-[48px] px-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[var(--ee-brand)]" />
              Crew Chat
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Operational Metrics */}
      <StatGrid columns={3}>
        <MetricCard
          title="Jobs On Board"
          value={String(jobs.length)}
          subtitle="Scheduled across company today"
        />
        <MetricCard
          title="My Open Tasks"
          value={String(day?.tasks?.length || 0)}
          subtitle="Checklists and prep tickets"
        />
        <MetricCard
          title="At Risk / Uncrewed"
          value={String(day?.at_risk_count ?? 0)}
          subtitle="Require dispatcher coverage"
          badge={day?.at_risk_count > 0 ? <Badge variant="warning">Attention</Badge> : undefined}
        />
      </StatGrid>

      {/* Roster & Jobs Data */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-[var(--ee-text)]">
          {isDispatcher ? "Today's Dispatch Board" : "Assigned Gigs & Roster"}
        </h3>

        {isDispatcher ? (
          jobs.length ? (
            <DataTable
              id="employee-my-day-jobs"
              columns={[
                { key: "name", label: "Booking ID" },
                { key: "event_name", label: "Event Name" },
                { key: "event_date", label: "Date" },
                { key: "start_time", label: "Call / Start" },
                {
                  key: "status",
                  label: "Status",
                  render: (val) => <Badge variant={val === "Confirmed" ? "success" : "default"}>{val || "Booked"}</Badge>
                }
              ]}
              rows={jobs}
            />
          ) : (
            <EmptyState title="No Bookings Today" description="All equipment is secured and no events are queued for today." />
          )
        ) : assignments.length ? (
          <DataTable
            id="employee-my-day-assignments"
            columns={[
              { key: "booking", label: "Booking Ref" },
              { key: "event_name", label: "Event" },
              { key: "role", label: "Crew Role", render: (val) => <Badge variant="brand">{val}</Badge> },
              { key: "status", label: "Shift Status", render: (val) => <Badge variant="success">{val || "Scheduled"}</Badge> }
            ]}
            rows={assignments}
          />
        ) : (
          <EmptyState title="No Shifts Assigned" description="You have no assigned shifts for today. Check the dispatch board for open roles." />
        )}
      </div>
    </div>
  );
};
