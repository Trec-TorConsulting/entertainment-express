import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Calendar, CheckCircle2, MapPin, AlertTriangle, ArrowRight, PlusCircle, Inbox, DollarSign
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
  const atRiskCount = Number(stats?.at_risk_count || 0);
  const pendingApprovals = approvals.length || 0;
  const hasActionNeeded = atRiskCount > 0 || pendingApprovals > 0;

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="space-y-8 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Friendly Hero Header */}
      <motion.div variants={itemVariants}>
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: What's Next (Upcoming Gigs) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-5">
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
        </motion.div>

        {/* Right Column: Quick Actions & Attention Needed */}
        <motion.div variants={itemVariants} className="space-y-8">
          
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
                onClick={() => navigate("/calendar")}
              >
                <Calendar className="w-6 h-6 mb-1 text-[var(--ee-brand)]" />
                Full Calendar
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
                
                {pendingApprovals > 0 && (
                  <Card 
                    interactive 
                    className="p-4 border-l-4 border-l-[var(--ee-brand)] flex items-center justify-between hover:bg-[var(--ee-surface-inset)]"
                    onClick={() => navigate("/owner")}
                  >
                    <div>
                      <h4 className="font-bold text-[var(--ee-text)]">Pending Approvals</h4>
                      <p className="text-sm text-[var(--ee-muted)]">{pendingApprovals} item{pendingApprovals === 1 ? " requires" : "s require"} your review.</p>
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

        </motion.div>
      </div>
    </motion.div>
  );
};

