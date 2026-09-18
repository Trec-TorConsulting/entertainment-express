import React, { useEffect, useState } from "react";
import { InstantPayoutCard } from "../../components/InstantPayoutCard";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
  useToast,
  call,
  getSessionBootstrap,
} from "@portal-kit";
import {
  User,
  Clock,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Send,
  Briefcase,
  Mail,
  Building2,
  ChevronRight,
} from "lucide-react";

interface TimeOffItem {
  name?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  approval_status?: string;
  status?: string;
}

export const MyProfilePage: React.FC = () => {
  const { toast } = useToast();
  const bootstrap = getSessionBootstrap();
  const userEmail = bootstrap.user || bootstrap.email || "Staff Member";
  const fullName = bootstrap.full_name || bootstrap.first_name || userEmail.split("@")[0];
  const roles = bootstrap.roles || [];
  const tenantName = bootstrap.tenant_name || "Entertainment Express";

  // State: Availability Hours
  const [loadingHours, setLoadingHours] = useState(false);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");

  // State: Time-Off Requests
  const [timeOffs, setTimeOffs] = useState<TimeOffItem[]>([]);
  const [loadingTimeOff, setLoadingTimeOff] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false);

  // Load My Hours & Time Off
  const loadData = async () => {
    try {
      const hoursRes = await call("entertainment_express.api.portal_hr.get_my_hours", {});
      if (hoursRes && hoursRes.days && hoursRes.days.monday) {
        if (hoursRes.days.monday.start) setStartTime(hoursRes.days.monday.start);
        if (hoursRes.days.monday.end) setEndTime(hoursRes.days.monday.end);
      }
    } catch {
      // Fallback defaults
    }

    try {
      setLoadingTimeOff(true);
      const timeOffRes = await call("entertainment_express.api.portal_hr.my_time_off", {});
      setTimeOffs(Array.isArray(timeOffRes) ? timeOffRes : []);
    } catch {
      setTimeOffs([]);
    } finally {
      setLoadingTimeOff(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveHours = async () => {
    setLoadingHours(true);
    try {
      const days: Record<string, { start: string; end: string }> = {};
      ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(
        (day) => {
          days[day] = { start: startTime, end: endTime };
        }
      );
      await call("entertainment_express.api.portal_hr.save_my_hours", { days });
      toast({
        title: "Availability Updated",
        description: `Typical shift hours set to ${startTime} - ${endTime} for dispatch matching.`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not save hours.",
        variant: "destructive",
      });
    } finally {
      setLoadingHours(false);
    }
  };

  const handleSaveTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast({
        title: "Date Required",
        description: "Please select at least a start date.",
        variant: "destructive",
      });
      return;
    }
    setSubmittingTimeOff(true);
    try {
      await call("entertainment_express.api.portal_hr.save_my_time_off", {
        start_date: startDate,
        end_date: endDate || startDate,
        reason: reason.trim(),
      });
      toast({
        title: "Time-Off Submitted",
        description: "Your time-off request has been submitted for owner approval.",
      });
      setStartDate("");
      setEndDate("");
      setReason("");
      loadData();
    } catch (err: any) {
      toast({
        title: "Request Failed",
        description: err?.message || "Could not submit time-off request.",
        variant: "destructive",
      });
    } finally {
      setSubmittingTimeOff(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/method/logout";
  };

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Profile & Field Availability"
        subtitle="Manage your shift hours, time-off requests, payout preferences, and account security."
      />

      {/* Hero: Staff Identity Header */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl border-2 border-purple-300/40 shadow-lg shadow-purple-900/50">
              {getInitials(fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{fullName}</h2>
                <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Active Staff
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  {userEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  {tenantName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="outline" className="bg-purple-900/40 text-purple-200 border-purple-500/40 text-xs px-2.5 py-1">
                <Briefcase className="w-3 h-3 mr-1 text-purple-400" />
                {role.replace("EE ", "")}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Shift Hours & Weekly Availability */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Shift Availability</h3>
              <p className="text-xs text-slate-400">Set typical working hours for auto-dispatch matching.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Typical Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Typical End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSaveHours}
            disabled={loadingHours}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-md transition-all"
          >
            {loadingHours ? "Saving Hours..." : "Save Availability Hours"}
          </Button>
        </Card>

        {/* Card 2: Instant Payout Widget */}
        <InstantPayoutCard />
      </div>

      {/* Card 3: Request Time-Off */}
      <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Time-Off Requests</h3>
              <p className="text-xs text-slate-400">Request vacation, blackout dates, or medical leave.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveTimeOff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Through Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Vacation / Personal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button
              type="submit"
              disabled={submittingTimeOff}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submittingTimeOff ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>

        {/* History Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Time-Off History</h4>
          {loadingTimeOff ? (
            <Skeleton height="80px" />
          ) : timeOffs.length === 0 ? (
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-lg text-center text-xs text-slate-400">
              No time-off requests recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {timeOffs.map((to, i) => (
                <div
                  key={to.name || i}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg flex items-center justify-between text-xs text-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-semibold">{to.start_date}</span>
                      {to.end_date && to.end_date !== to.start_date && (
                        <span> through {to.end_date}</span>
                      )}
                      {to.reason && <span className="text-slate-400 ml-2">({to.reason})</span>}
                    </div>
                  </div>
                  <Badge
                    variant={
                      (to.approval_status || to.status) === "Approved"
                        ? "success"
                        : (to.approval_status || to.status) === "Rejected"
                        ? "destructive"
                        : "outline"
                    }
                    className="text-[11px]"
                  >
                    {to.approval_status || to.status || "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Card 4: Security & Session */}
      <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Active Session</h3>
            <p className="text-xs text-slate-400">Authenticated as {userEmail}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleLogout}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default MyProfilePage;
