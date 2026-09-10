import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DonutProgress,
  PlanningProgress,
  Skeleton,
  call,
  getSessionBootstrap
} from "@portal-kit";
import {
  Sparkles, Calendar, CreditCard, ArrowRight,
  Clock, MapPin, CheckCircle2, ChevronRight, FileCheck,
  MessageSquare, UserPlus, Video, AlertCircle
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";
import { formatMoney } from "../../utils/money";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [events, setEvents] = useState<any[]>([]);
  const [money, setMoney] = useState<any>(null);
  const [action, setAction] = useState<any>(null);
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);
  const [planningForms, setPlanningForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const bookingParam = searchParams.get("booking");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await call("entertainment_express.api.portal_collaboration.list_my_events", {});
        const evList = eventsRes || [];
        setEvents(evList);

        const currentBooking = evList.find((e: any) => e.name === bookingParam) || evList[0];

        if (currentBooking?.name) {
          call("entertainment_express.api.planning.list_forms", { booking_name: currentBooking.name })
            .then((res) => setPlanningForms(res || []))
            .catch(() => setPlanningForms([]));
        }

        if (!guest) {
          const [moneyRes, actionRes, apptRes] = await Promise.allSettled([
            call("entertainment_express.api.portal_reports.client_money_summary", {}),
            call("entertainment_express.api.portal_client.next_action", {}),
            call("entertainment_express.api.appointments.my_appointments", {})
          ]);

          if (moneyRes.status === "fulfilled") setMoney(moneyRes.value);
          if (actionRes.status === "fulfilled") setAction(actionRes.value);
          if (apptRes.status === "fulfilled" && Array.isArray(apptRes.value) && apptRes.value.length > 0) {
            setUpcomingMeeting(apptRes.value[0]);
          }
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guest, bookingParam]);

  const activeEvent = events.find((e) => e.name === bookingParam) || events[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="240px" height="2rem" />
        <Skeleton height="10rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="8rem" />
          <Skeleton height="8rem" />
        </div>
      </div>
    );
  }

  if (guest) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <PageHeader
          title={activeEvent?.event_name || "Event Planning Workspace"}
          subtitle="Collaborate with your event host to select music, customize timeline moments, and coordinate details."
          badge={<Badge variant="brand">Guest Collaborator</Badge>}
        />

        <Card elevated className="p-6 sm:p-8 text-center space-y-4 border-[var(--ee-brand-border)] bg-gradient-to-br from-[var(--ee-brand-soft)]/40 to-[var(--ee-surface-raised)]">
          <Sparkles className="w-12 h-12 text-[var(--ee-brand)] mx-auto" />
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-bold text-xl text-[var(--ee-text)]">
              Welcome to {activeEvent?.event_name || "the Event Hub"}!
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ee-muted)] leading-relaxed">
              Help make this event unforgettable! Submit must-play songs, suggest schedule adjustments, and chat with the entertainers and coordinator.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <Button
              variant="primary"
              density="consumer"
              onClick={() => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Song & Planning Hub
            </Button>
            <Button
              variant="outline"
              density="consumer"
              onClick={() => navigate(`/chat?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Message Host & DJ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Next action hero configuration
  const actionHero = action?.key === "sign" ? {
    title: "Review & Sign Your Agreement",
    description: "Your entertainment contract is ready. E-sign securely in under 2 minutes to guarantee your event date.",
    buttonLabel: "Review & Sign Contract",
    badge: "Contract Ready",
    variant: "warning" as const,
    onClick: () => navigate(`/documents?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  } : action?.key === "pay" || Number(money?.remaining || 0) > 0 ? {
    title: "Confirm Your Date with a Deposit",
    description: `A balance of ${formatMoney(money?.remaining || "500.00")} is due. Submit payment securely online with card, ACH, or mobile wallet.`,
    buttonLabel: "Pay Deposit Now",
    badge: "Payment Due",
    variant: "warning" as const,
    onClick: () => navigate(`/pay?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  } : {
    title: "Customize Your Run Sheet & Music",
    description: "Lock in favorite songs, do-not-play tracks, and ceremony cues so our team delivers the exact vibe you envision.",
    buttonLabel: "Complete Event Details",
    badge: "Planning In Progress",
    variant: "brand" as const,
    onClick: () => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  };

  // Calculate planning completion
  const formPercent = planningForms.length > 0
    ? Math.round(planningForms.reduce((acc, f) => acc + Number(f.completion_percent || 0), 0) / planningForms.length)
    : 75;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Flagship Next-Action Hero */}
      <Card elevated className="border-[var(--ee-brand-border)] bg-gradient-to-r from-[var(--ee-brand-soft)]/50 via-[var(--ee-surface-raised)] to-[var(--ee-surface-raised)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant={actionHero.variant} size="sm" dot>
              {actionHero.badge}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ee-text)]">
              {actionHero.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ee-muted)] leading-relaxed">
              {actionHero.description}
            </p>
          </div>
          <Button
            variant="primary"
            density="consumer"
            onClick={actionHero.onClick}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0 shadow-md"
          >
            {actionHero.buttonLabel}
          </Button>
        </div>
      </Card>

      {/* Upcoming Consultation Banner if scheduled */}
      {upcomingMeeting && (
        <Card elevated className="border-blue-500/30 bg-blue-500/5 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Upcoming Consultation
                </span>
                <h4 className="text-sm font-semibold text-[var(--ee-text)]">
                  {upcomingMeeting.subject || "Event Planning Consultation"}
                </h4>
                <p className="text-xs text-[var(--ee-muted)]">
                  {upcomingMeeting.start_time} · With {upcomingMeeting.host_name || "Your Event Coordinator"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {upcomingMeeting.meet_url ? (
                <a
                  href={upcomingMeeting.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Join Meeting
                </a>
              ) : null}
              <Button
                variant="outline"
                density="consumer"
                onClick={() => navigate(`/appointments?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Event Carousel / Picker */}
      {events.length > 1 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)]">
              Your Bookings ({events.length})
            </span>
            <Button
              variant="ghost"
              density="consumer"
              onClick={() => navigate("/events")}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              All Events
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Card
                key={ev.name}
                interactive
                onClick={() => navigate(`/?booking=${encodeURIComponent(ev.name)}`)}
                className={`p-4 space-y-2 transition-all ${ev.name === activeEvent?.name ? "border-[var(--ee-brand)] ring-2 ring-[var(--ee-brand)]/20 shadow-md" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm text-[var(--ee-text)] truncate">{ev.event_name || ev.name}</h4>
                  <Badge variant="success" size="sm">{ev.status || "Confirmed"}</Badge>
                </div>
                <div className="text-xs text-[var(--ee-muted)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                  <span>{ev.event_date || "Date Pending"}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Money Summary & Planning Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Money Summary */}
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--ee-brand)]" />
                Billing & Balances
              </span>
              <Button
                variant="ghost"
                density="consumer"
                onClick={() => navigate(`/pay?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Billing Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 p-4 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)] text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">Total Billed</span>
                <span className="font-mono font-bold text-base sm:text-lg tabular-nums text-[var(--ee-text)]">
                  {formatMoney(money?.owed)}
                </span>
              </div>
              <div className="border-x border-[var(--ee-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">Paid So Far</span>
                <span className="font-mono font-bold text-base sm:text-lg tabular-nums text-[var(--ee-success)]">
                  {formatMoney(money?.paid)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">Balance Due</span>
                <span className="font-mono font-bold text-base sm:text-lg tabular-nums text-[var(--ee-brand)]">
                  {formatMoney(money?.remaining)}
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              density="consumer"
              className="w-full"
              onClick={() => navigate(`/pay?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
            >
              Make Payment / View Invoices
            </Button>
          </CardContent>
        </Card>

        {/* Planning Progress Rings */}
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--ee-brand)]" />
                Planning Progress
              </span>
              <Button
                variant="ghost"
                density="consumer"
                onClick={() => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Run Sheet
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanningProgress
              title="Event Run Sheet & Selections"
              overallPercent={formPercent}
              sections={[
                { id: "timeline", label: "Timeline & Key Moments", completed: formPercent >= 80, percent: Math.min(100, formPercent + 15) },
                { id: "music", label: "Must-Play & Special Songs", completed: formPercent >= 60, percent: formPercent },
                { id: "logistics", label: "Venue Logistics & Access", completed: formPercent >= 40, percent: Math.max(30, formPercent - 20) },
              ]}
              onSectionClick={() => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchpad Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <Card
          interactive
          className="p-4 flex flex-col items-center text-center gap-2"
          onClick={() => navigate(`/chat?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--ee-brand-soft)] text-[var(--ee-brand-text)] flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--ee-text)]">Live Chat</span>
          <span className="text-[10px] text-[var(--ee-muted)]">Message Talent & Team</span>
        </Card>

        <Card
          interactive
          className="p-4 flex flex-col items-center text-center gap-2"
          onClick={() => navigate(`/people?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--ee-text)]">Co-Hosts & Guests</span>
          <span className="text-[10px] text-[var(--ee-muted)]">Invite Collaborators</span>
        </Card>

        <Card
          interactive
          className="p-4 flex flex-col items-center text-center gap-2"
          onClick={() => navigate(`/documents?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--ee-text)]">Contracts & Docs</span>
          <span className="text-[10px] text-[var(--ee-muted)]">Review & Sign</span>
        </Card>

        <Card
          interactive
          className="p-4 flex flex-col items-center text-center gap-2"
          onClick={() => navigate(`/appointments?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[var(--ee-text)]">Consultations</span>
          <span className="text-[10px] text-[var(--ee-muted)]">Schedule Call</span>
        </Card>
      </div>
    </div>
  );
};
