import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  call,
  getSessionBootstrap
} from "@portal-kit";
import {
  Calendar, CheckCircle2, MapPin, AlertTriangle, ArrowRight, PlusCircle, Inbox, DollarSign, Clock
} from "lucide-react";

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const person = getSessionBootstrap().person;
  const [stats, setStats] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (person?.full_name || "there").split(" ")[0];

  const loadData = async () => {
    try {
      const [statsRes, approvalsRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_owner.get_owner_dashboard", {}),
        call("entertainment_express.api.portal_owner.get_approvals", {})
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (approvalsRes.status === "fulfilled") setApprovals(approvalsRes.value || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const jobs = stats?.jobs || [];
  const consultations = stats?.consultations || [];
  const atRiskCount = Number(stats?.at_risk_count || 0);
  const pendingConsults = approvals.filter((a: any) => a.type === "appointment");
  const otherApprovals = approvals.filter((a: any) => a.type !== "appointment");
  const pendingApprovals = approvals.length || 0;
  const hasActionNeeded = atRiskCount > 0 || pendingApprovals > 0;

  const handleActOnApproval = async (appt: any, decision: string) => {
    try {
      await call("entertainment_express.api.portal_owner.act_on_approval", {
        approval_type: "appointment",
        doctype: "EE Appointment",
        name: appt.id || appt.name,
        decision,
      });
      await loadData();
    } catch {
      // Reload on failure
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200 p-2 sm:p-0">
        <Skeleton width="250px" height="2.5rem" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton height="20rem" />
          </div>
          <div className="space-y-4">
            <Skeleton height="10rem" />
            <Skeleton height="10rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Friendly Hero Header */}
      <div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)]">
            {greeting}, {firstName}!
          </h1>
          <p className="text-base text-[var(--ee-muted)]">
            {jobs.length > 0 
              ? `You have ${jobs.length} gig${jobs.length === 1 ? "" : "s"} coming up.` 
              : "Your schedule is clear right now."}
            {hasActionNeeded && " There are a few things that need your attention."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: What's Next (Upcoming Gigs & Consults) */}
        <div className="lg:col-span-2 space-y-7">
          {/* Consultations Card */}
          {consultations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--ee-brand)]" />
                  Planning Consultations
                </h2>
                <Button variant="ghost" density="ops" size="sm" onClick={() => navigate("/schedule")}>
                  Manage Schedule
                </Button>
              </div>
              <div className="space-y-3">
                {consultations.slice(0, 4).map((c: any) => (
                  <Card key={c.id || c.name} elevated className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={c.status === "requested" ? "warning" : "success"} size="sm">
                          {c.status === "requested" ? "Requested" : "Confirmed"}
                        </Badge>
                        <h4 className="font-semibold text-sm text-[var(--ee-text)]">{c.who || "Client"}</h4>
                        {c.event_booking && (
                          <Badge variant="outline" size="sm">
                            {c.event_booking}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--ee-muted)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {c.start} {c.appointment_type ? `· ${c.appointment_type === "phone" ? "Phone Call" : "Google Meet Video"}` : ""}
                      </p>
                      {c.notes && (
                        <p className="text-[11px] text-[var(--ee-muted)] italic truncate max-w-md">
                          "{c.notes}"
                        </p>
                      )}
                    </div>
                    {c.status === "requested" && (
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <Button
                          variant="primary"
                          density="consumer"
                          size="sm"
                          onClick={() => handleActOnApproval(c, "approved")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          density="consumer"
                          size="sm"
                          onClick={() => handleActOnApproval(c, "rejected")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--ee-brand)]" />
              What's Next
            </h2>
          </div>

          {jobs.length ? (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job: any) => (
                <Card
                  key={job.name}
                  interactive
                  onClick={() => navigate(`/calendar/${encodeURIComponent(job.name)}`)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[var(--ee-text)] hover:text-[var(--ee-brand)] transition-colors">
                        {job.event_name || job.name}
                      </h3>
                      <Badge variant={job.status === "Confirmed" ? "success" : "default"}>
                        {job.status || "Booked"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-[var(--ee-muted)] flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {job.event_date} {job.start_time ? `• ${job.start_time}` : ""}
                    </p>

                    {job.venue_address && (
                      <p className="text-sm text-[var(--ee-muted)] flex items-center gap-1.5 truncate max-w-sm">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{job.venue_address}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {job.planning_incomplete && (
                      <Badge variant="warning">Planning Needed</Badge>
                    )}
                    <Button variant="ghost" density="cockpit" className="shrink-0 rounded-full h-10 w-10 p-0 hidden sm:flex">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              ))}
              
              {jobs.length > 5 && (
                <Button 
                  variant="ghost" 
                  density="ops" 
                  className="w-full text-[var(--ee-muted)]"
                  onClick={() => navigate("/calendar")}
                >
                  View all scheduled gigs
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-8 border-dashed bg-transparent">
              <EmptyState
                title="Your calendar is open"
                description="When you book a gig, it will show up right here so you know exactly what's coming next."
                actionLabel="Add a Gig"
                onAction={() => navigate("/pipeline?action=new")}
              />
            </Card>
          )}
        </div>

        {/* Right Column: Quick Actions & Attention Needed */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--ee-text)]">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                className="flex-col gap-2 h-auto py-4 rounded-xl shadow-ee-sm"
                onClick={() => navigate("/pipeline?action=new")}
              >
                <PlusCircle className="w-6 h-6 mb-1" />
                Add a Gig
              </Button>
              <Button
                variant="secondary"
                className="flex-col gap-2 h-auto py-4 rounded-xl shadow-ee-sm bg-[var(--ee-surface-raised)]"
                onClick={() => navigate("/schedule")}
              >
                <Clock className="w-6 h-6 mb-1 text-[var(--ee-brand)]" />
                Consults
              </Button>
              <Button
                variant="secondary"
                className="flex-col gap-2 h-auto py-4 rounded-xl shadow-ee-sm bg-[var(--ee-surface-raised)]"
                onClick={() => navigate("/pipeline")}
              >
                <Inbox className="w-6 h-6 mb-1 text-[var(--ee-info)]" />
                My Pipeline
              </Button>
              <Button
                variant="secondary"
                className="flex-col gap-2 h-auto py-4 rounded-xl shadow-ee-sm bg-[var(--ee-surface-raised)]"
                onClick={() => navigate("/money")}
              >
                <DollarSign className="w-6 h-6 mb-1 text-[var(--ee-success)]" />
                Finances
              </Button>
            </div>
          </div>

          {/* Action Needed */}
          {hasActionNeeded && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--ee-warning)]" />
                Action Needed
              </h2>
              <div className="space-y-3">
                {/* Pending Consultation Requests Card */}
                {pendingConsults.length > 0 && (
                  <Card className="p-4 border-l-4 border-l-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/20 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[var(--ee-text)]">Consultation Requests</h4>
                        <Badge variant="brand" size="sm">{pendingConsults.length} New</Badge>
                      </div>
                      <p className="text-xs text-[var(--ee-muted)] mt-0.5">
                        {pendingConsults.length} client meeting{pendingConsults.length === 1 ? "" : "s"} awaiting your confirmation.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--ee-border)]">
                      {pendingConsults.map((appt: any) => (
                        <div key={appt.id || appt.name} className="p-2.5 rounded-lg bg-[var(--ee-surface-raised)] space-y-2">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <span className="font-semibold text-[var(--ee-text)] block">{appt.summary || "Client Consultation"}</span>
                              <span className="text-[var(--ee-muted)]">{appt.date}</span>
                            </div>
                            {appt.event && (
                              <Badge variant="outline" size="sm">{appt.event}</Badge>
                            )}
                          </div>
                          {appt.notes && (
                            <p className="text-[11px] text-[var(--ee-muted)] italic truncate">
                              "{appt.notes}"
                            </p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="primary"
                              density="consumer"
                              size="sm"
                              className="w-full text-xs font-semibold"
                              onClick={() => handleActOnApproval(appt, "approved")}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              density="consumer"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleActOnApproval(appt, "rejected")}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {atRiskCount > 0 && (
                  <Card 
                    interactive 
                    className="p-4 border-l-4 border-l-[var(--ee-warning)] flex items-center justify-between hover:bg-[var(--ee-surface-inset)]"
                    onClick={() => navigate("/dispatch")}
                  >
                    <div>
                      <h4 className="font-bold text-[var(--ee-text)]">Missing Crew</h4>
                      <p className="text-sm text-[var(--ee-muted)]">{atRiskCount} gig{atRiskCount === 1 ? " needs" : "s need"} staff assigned.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--ee-muted)]" />
                  </Card>
                )}
                
                {otherApprovals.length > 0 && (
                  <Card 
                    interactive 
                    className="p-4 border-l-4 border-l-[var(--ee-brand)] flex items-center justify-between hover:bg-[var(--ee-surface-inset)]"
                    onClick={() => navigate("/owner")}
                  >
                    <div>
                      <h4 className="font-bold text-[var(--ee-text)]">Other Approvals</h4>
                      <p className="text-sm text-[var(--ee-muted)]">{otherApprovals.length} item{otherApprovals.length === 1 ? " requires" : "s require"} your review.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--ee-muted)]" />
                  </Card>
                )}
              </div>
            </div>
          )}

          {!hasActionNeeded && jobs.length > 0 && (
             <div className="p-6 rounded-2xl bg-[var(--ee-success-soft)] border border-[var(--ee-success-border)] text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[var(--ee-success)] mx-auto opacity-90" />
                <h3 className="font-bold text-[var(--ee-success-text)] text-lg">You're all caught up!</h3>
                <p className="text-sm text-[var(--ee-success-text)] opacity-90">No pending tasks or missing crew. Great job!</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

