import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  PageHeader,
  StatGrid,
  MetricCard,
  Sparkline,
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
  Calendar, AlertTriangle, CheckCircle2, Clock, MapPin,
  TrendingUp, Users, ArrowRight, ShieldCheck, DollarSign
} from "lucide-react";

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const person = getSessionBootstrap().person;
  const [stats, setStats] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [setup, setSetup] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (person?.full_name || "there").split(" ")[0];
  const todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const loadData = async () => {
    try {
      const [statsRes, approvalsRes, workflowsRes, setupRes, forecastRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_owner.get_owner_dashboard", {}),
        call("entertainment_express.api.portal_owner.get_approvals", {}),
        call("entertainment_express.api.portal_proposal.today_workflows", {}),
        call("entertainment_express.api.migration.onboarding", {}),
        call("entertainment_express.api.ai.forecast", { months: 3 })
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (approvalsRes.status === "fulfilled") setApprovals(approvalsRes.value || []);
      if (workflowsRes.status === "fulfilled") setWorkflows(workflowsRes.value || []);
      if (setupRes.status === "fulfilled") setSetup(setupRes.value);
      if (forecastRes.status === "fulfilled") setForecast(forecastRes.value);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <div className="space-y-2">
          <Skeleton width="180px" height="1.25rem" />
          <Skeleton width="320px" height="2.25rem" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="6.5rem" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton height="14rem" />
          </div>
          <div>
            <Skeleton height="14rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Flagship Hero Header */}
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={
          atRiskCount > 0
            ? `${todayDateString} • ${atRiskCount} job${atRiskCount === 1 ? "" : "s"} need crew dispatch review.`
            : `${todayDateString} • All operations running on schedule.`
        }
        badge={
          atRiskCount > 0 ? (
            <Badge variant="warning" dot>
              {atRiskCount} At Risk
            </Badge>
          ) : (
            <Badge variant="success" dot>
              All Systems Ready
            </Badge>
          )
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              density="cockpit"
              onClick={() => navigate("/calendar")}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Calendar
            </Button>
            <Button
              variant="primary"
              density="cockpit"
              onClick={() => navigate("/pipeline?action=new")}
            >
              + New Inquiry
            </Button>
          </div>
        }
      />

      {/* Setup Checklist Banner if onboarding active */}
      {setup && !setup.complete && (
        <Card elevated className="border-[var(--ee-brand-border)] bg-[var(--ee-brand-soft)]/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[var(--ee-brand-text)]">
                <ShieldCheck className="w-5 h-5" />
                Finish Setting Up Your Company
              </CardTitle>
              <span className="text-xs font-semibold text-[var(--ee-brand-text)]">
                {setup.completed_count || 0} of {setup.steps?.length || 0} completed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(setup.steps || []).map((step: any) => (
                <NavLink
                  key={step.key}
                  to={step.href || "#"}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] hover:border-[var(--ee-brand)] transition-colors text-xs font-medium text-[var(--ee-text)] shadow-sm"
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--ee-success)] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[var(--ee-muted)] shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                </NavLink>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flagship StatGrid Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Billed This Month"
          value={`$${stats?.revenue || "0.00"}`}
          subtitle="Total recognized revenue"
          trend="+12.4%"
          trendDirection="up"
          sparkline={<Sparkline data={[12, 14, 18, 22, 28, 35, 42]} width={80} height={24} color="var(--ee-brand)" />}
        />
        <MetricCard
          title="What Customers Owe"
          value={`$${stats?.outstanding_balance || "0.00"}`}
          subtitle="Uncollected balances"
          trend={Number(stats?.outstanding_balance) > 0 ? "Due now" : "All clear"}
          trendDirection={Number(stats?.outstanding_balance) > 0 ? "down" : "neutral"}
          sparkline={<Sparkline data={[50, 45, 40, 32, 28, 20, 18]} width={80} height={24} color="var(--ee-warning)" />}
        />
        <MetricCard
          title="Open Quotes"
          value={`$${stats?.pipeline_value || "0.00"}`}
          subtitle="Pipeline proposal value"
          trend="+3 quotes"
          trendDirection="up"
          sparkline={<Sparkline data={[15, 20, 18, 25, 30, 38, 45]} width={80} height={24} color="var(--ee-success)" />}
        />
      </StatGrid>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Jobs On The Books"
          value={String(stats?.new_bookings || jobs.length || 0)}
          subtitle="Confirmed bookings"
        />
        <MetricCard
          title="Needs Crew"
          value={String(atRiskCount)}
          subtitle="Unassigned roles"
          badge={atRiskCount > 0 ? <Badge variant="warning" size="sm">Attention</Badge> : undefined}
          onClick={() => navigate("/dispatch")}
        />
        <MetricCard
          title="Open Tasks & Chats"
          value={String((approvals.length || 0) + (stats?.unread_chat || 0))}
          subtitle="Requires attention"
          badge={(approvals.length > 0) ? <Badge variant="brand" size="sm">{approvals.length} pending</Badge> : undefined}
        />
      </div>

      {/* Week Schedule Strip & Jobs Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Scheduled Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-[var(--ee-text)]">
              Scheduled Jobs & Events
            </h2>
            <Button
              variant="ghost"
              density="cockpit"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate("/calendar")}
            >
              View Full Calendar
            </Button>
          </div>

          {jobs.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.slice(0, 6).map((job: any) => (
                <Card
                  key={job.name}
                  interactive
                  onClick={() => navigate(`/calendar/${encodeURIComponent(job.name)}`)}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--ee-text)] hover:text-[var(--ee-brand)]">
                        {job.event_name || job.name}
                      </h3>
                      <p className="text-xs text-[var(--ee-muted)] mt-0.5">
                        {job.event_date} {job.start_time ? `• ${job.start_time}` : ""}
                      </p>
                    </div>
                    <Badge variant={job.status === "Confirmed" ? "success" : "default"} size="sm">
                      {job.status || "Booked"}
                    </Badge>
                  </div>

                  {job.venue_address && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ee-muted)] truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{job.venue_address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--ee-border-subtle)] text-xs">
                    {job.planning_incomplete ? (
                      <span className="text-[var(--ee-warning-text)] font-medium">
                        Planning {Math.round(Number(job.planning_percent) || 0)}%
                      </span>
                    ) : (
                      <span className="text-[var(--ee-muted)]">Run sheet ready</span>
                    )}
                    {job.balance_due && (
                      <span className="font-mono tabular-nums text-[var(--ee-muted)]">
                        Due: {job.balance_due}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-[var(--ee-border)] rounded-xl bg-[var(--ee-surface-raised)]">
              <EmptyState
                title="No jobs scheduled this week"
                description="When bookings and contracts are confirmed, their logistics and timeline will appear here."
                actionLabel="Create Booking"
                onAction={() => navigate("/calendar/new")}
              />
            </div>
          )}
        </div>

        {/* Right Column: Approvals & Workflow Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-[var(--ee-text)]">
            Inbox & Approvals
          </h2>

          <Card elevated className="p-4 space-y-4">
            {approvals.length ? (
              <div className="space-y-3">
                {approvals.map((item: any, idx: number) => (
                  <div
                    key={item.name || idx}
                    className="p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-[var(--ee-text)]">
                      <span>{item.title || item.subject || "Action Required"}</span>
                      <Badge variant="brand" size="sm">Pending</Badge>
                    </div>
                    <p className="text-[var(--ee-muted)]">
                      {item.description || item.comment || "Review requested by crew or client."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--ee-muted)] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[var(--ee-success)] mx-auto opacity-80" />
                <p className="font-medium text-[var(--ee-text)]">You're all clear</p>
                <p>No pending approvals or unread messages requiring attention.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
