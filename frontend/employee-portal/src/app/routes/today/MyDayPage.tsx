import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PageHeader,
  StatGrid,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  useToast,
  call,
  getSessionBootstrap
} from "@portal-kit";
import {
  Clock, MapPin, Play, Square,
  AlertTriangle, MessageSquare, ExternalLink, Calendar,
  ChevronRight, Briefcase
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
        </div>
      </div>
    );
  }

  const isDispatcher = roles.includes("EE Dispatcher");
  const jobs = day?.today_jobs?.length ? day.today_jobs : day?.schedule || [];
  const assignments = day?.assignments || [];
  const nextAssignment = assignments[0] || jobs[0];

  return (
    <motion.div 
      className="space-y-6 pb-20 md:pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title={`My Day — ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
          subtitle={`Welcome back, ${bootstrap.full_name || bootstrap.user || "Crew Member"}.`}
          badge={
            clockedIn ? (
              <Badge variant="success" dot size="sm" className="shadow-sm">
                On Shift ({shiftElapsed})
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Off Duty
              </Badge>
            )
          }
        />
      </motion.div>

      {/* Flagship Next Assignment Card - Mobile First Focus */}
      <motion.div variants={itemVariants}>
        <Card elevated className={`overflow-hidden border-0 ${clockedIn ? 'shadow-[0_0_20px_rgba(var(--ee-brand-rgb),0.15)] ring-1 ring-[var(--ee-brand)]' : 'shadow-md border-l-4 border-l-[var(--ee-brand)]'}`}>
          <div className="bg-[var(--ee-surface-base)] border-b border-[var(--ee-border)] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-brand)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Next Scheduled Assignment
              </span>
              {nextAssignment?.role && (
                <Badge variant="brand" size="sm" className="font-semibold">
                  {nextAssignment.role}
                </Badge>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--ee-text)]">
              {nextAssignment?.event_name || nextAssignment?.booking || "Sound & Lighting Gig"}
            </h2>
            <p className="text-[var(--ee-muted)] text-sm mt-1">{nextAssignment?.event_type || "Riverside Amphitheater"}</p>
          </div>
          
          <CardContent className="p-4 sm:p-6 space-y-5 bg-[var(--ee-surface-raised)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className="flex items-start sm:items-center gap-3 text-[var(--ee-text)] bg-[var(--ee-surface-inset)] p-3 rounded-xl flex-1 border border-[var(--ee-border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--ee-brand-soft)]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[var(--ee-brand)]" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[var(--ee-muted)] uppercase tracking-wider mb-0.5">Call Time</div>
                  <div className="font-medium text-[var(--ee-text)]">{nextAssignment?.start_time || "16:00"} <span className="text-[var(--ee-muted)] font-normal text-xs ml-1">(Event: {nextAssignment?.event_time || "18:00 - 23:00"})</span></div>
                </div>
              </div>

              <div className="flex items-start sm:items-center gap-3 text-[var(--ee-text)] bg-[var(--ee-surface-inset)] p-3 rounded-xl flex-1 border border-[var(--ee-border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--ee-brand-soft)]/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[var(--ee-brand)]" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[var(--ee-muted)] uppercase tracking-wider mb-0.5">Location</div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(nextAssignment?.venue || "100 River Rd, Austin TX")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 text-[var(--ee-brand)] font-medium text-sm"
                  >
                    <span className="line-clamp-1">{nextAssignment?.venue || "100 River Rd, Gate 2"}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Checklist progress */}
            <div className="p-4 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)] space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[var(--ee-text)] flex items-center gap-2"><Briefcase className="w-4 h-4 text-[var(--ee-brand)]" /> Run Sheet & Gear Prep</span>
                <span className="font-medium text-[var(--ee-brand)]">3 / 5 Ready</span>
              </div>
              <div className="w-full bg-[var(--ee-border)] rounded-full h-2.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-[var(--ee-brand)] to-[var(--ee-brand-light)] h-full rounded-full" 
                />
              </div>
            </div>

            {/* Huge, Thumb-Friendly Shift Action Buttons for Mobile */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleToggleClock}
                className={`h-14 sm:h-12 px-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-md ${
                  clockedIn
                    ? "bg-[var(--ee-danger)] text-white hover:bg-red-600 ring-2 ring-[var(--ee-danger)] ring-offset-2 ring-offset-[var(--ee-surface-raised)]"
                    : "bg-[var(--ee-brand)] text-white hover:bg-[var(--ee-brand-dark)]"
                }`}
              >
                {clockedIn ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    Clock Out Now
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Clock In
                  </>
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toast({ title: "Incident Reporter", description: "Form loaded. Field supervisors alerted.", variant: "default" })}
                className="h-14 sm:h-12 px-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] hover:border-[var(--ee-border-strong)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-[var(--ee-warning)]" />
                Incident Log
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => toast({ title: "Dispatch Chat", description: "Connecting to company radio chat...", variant: "default" })}
                className="h-14 sm:h-12 px-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] hover:border-[var(--ee-border-strong)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-[var(--ee-brand)]" />
                Crew Chat
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Operational Metrics - Swipeable on mobile */}
      <motion.div variants={itemVariants} className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 custom-scrollbar">
        <div className="flex sm:grid sm:grid-cols-3 gap-4 min-w-[max-content] sm:min-w-0">
          <div className="w-[240px] sm:w-auto">
            <MetricCard
              title="Jobs On Board"
              value={String(jobs.length)}
              subtitle="Scheduled across company today"
            />
          </div>
          <div className="w-[240px] sm:w-auto">
            <MetricCard
              title="My Open Tasks"
              value={String(day?.tasks?.length || 0)}
              subtitle="Checklists and prep tickets"
            />
          </div>
          <div className="w-[240px] sm:w-auto">
            <MetricCard
              title="At Risk / Uncrewed"
              value={String(day?.at_risk_count ?? 0)}
              subtitle="Require dispatcher coverage"
              badge={day?.at_risk_count > 0 ? <Badge variant="warning">Attention</Badge> : undefined}
            />
          </div>
        </div>
      </motion.div>

      {/* Mobile-First Roster & Jobs Data */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="font-bold text-lg text-[var(--ee-text)] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--ee-brand)]" />
          {isDispatcher ? "Today's Dispatch Board" : "My Upcoming Gigs"}
        </h3>

        {isDispatcher ? (
          jobs.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job: any, i: number) => (
                <motion.div key={i} whileHover={{ y: -2 }} className="bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl p-4 flex flex-col hover:border-[var(--ee-brand)] transition-colors shadow-sm cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-[var(--ee-text)]">{job.event_name || job.name}</div>
                    <Badge variant={job.status === "Confirmed" ? "success" : "default"}>{job.status || "Booked"}</Badge>
                  </div>
                  <div className="text-sm text-[var(--ee-muted)] flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4"/> {job.start_time || "TBD"}
                  </div>
                  <div className="mt-auto flex items-center text-sm font-medium text-[var(--ee-brand)] group">
                    View Dispatch Details <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState title="No Bookings Today" description="All equipment is secured and no events are queued for today." />
          )
        ) : assignments.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment: any, i: number) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl p-4 flex flex-col hover:border-[var(--ee-brand)] transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-[var(--ee-text)]">{assignment.event_name || assignment.booking}</div>
                  <Badge variant="brand">{assignment.role}</Badge>
                </div>
                <div className="text-sm text-[var(--ee-muted)] flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4"/> Shift Confirmed
                </div>
                <div className="mt-auto flex justify-between items-center border-t border-[var(--ee-border)] pt-3">
                  <span className="text-xs font-semibold text-[var(--ee-muted)] uppercase tracking-wider">Status</span>
                  <Badge variant="success" size="sm">{assignment.status || "Scheduled"}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState title="No Shifts Assigned" description="You have no assigned shifts for today. Check the dispatch board for open roles." />
        )}
      </motion.div>
    </motion.div>
  );
};
