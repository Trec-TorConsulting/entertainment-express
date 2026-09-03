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
  EmptyState,
  Skeleton,
  call,
  getSessionBootstrap
} from "@portal-kit";
import {
  Sparkles, Calendar, CreditCard, ArrowRight,
  Clock, MapPin, CheckCircle2, ChevronRight, FileCheck
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [events, setEvents] = useState<any[]>([]);
  const [money, setMoney] = useState<any>(null);
  const [action, setAction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingParam = searchParams.get("booking");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await call("entertainment_express.api.portal_collaboration.list_my_events", {});
        const evList = eventsRes || [];
        setEvents(evList);

        if (!guest) {
          const [moneyRes, actionRes] = await Promise.allSettled([
            call("entertainment_express.api.portal_reports.client_money_summary", {}),
            call("entertainment_express.api.portal_client.next_action", {})
          ]);

          if (moneyRes.status === "fulfilled") setMoney(moneyRes.value);
          if (actionRes.status === "fulfilled") setAction(actionRes.value);
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guest]);

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
          subtitle="You're collaborating with the host to plan music, timelines, and special moments."
          badge={<Badge variant="brand">Guest Collaborator</Badge>}
        />

        <Card elevated className="p-6 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-[var(--ee-brand)] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-[var(--ee-text)]">
              Welcome to {activeEvent?.event_name || "the Event Hub"}!
            </h3>
            <p className="text-xs text-[var(--ee-muted)] max-w-md mx-auto">
              Help request must-play and do-not-play songs, build out the run sheet, and chat directly with the event coordinators.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="primary"
              density="consumer"
              onClick={() => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Planning Hub
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Next action hero configuration
  const actionHero = action?.key === "sign" ? {
    title: "Review & Sign Your Agreement",
    description: "Your entertainment contract is ready. E-sign now to lock in your date on our calendar.",
    buttonLabel: "Review & Sign Contract",
    badge: "Contract Ready",
    onClick: () => navigate(`/documents?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  } : action?.key === "pay" || Number(money?.remaining || 0) > 0 ? {
    title: "Secure Your Date with a Deposit",
    description: `A balance of $${money?.remaining || "500.00"} is pending. Submit payment securely online.`,
    buttonLabel: "Pay Deposit Now",
    badge: "Payment Due",
    onClick: () => navigate(`/pay?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  } : {
    title: "Customize Your Run Sheet & Music",
    description: "A few timeline details and favorite song requests will help us tailor an unforgettable night.",
    buttonLabel: "Complete Event Details",
    badge: "Next Step",
    onClick: () => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Flagship Next-Action Hero */}
      <Card elevated className="border-[var(--ee-brand-border)] bg-gradient-to-r from-[var(--ee-brand-soft)]/50 via-[var(--ee-surface-raised)] to-[var(--ee-surface-raised)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant="brand" size="sm" dot>
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

      {/* Event Carousel / Picker */}
      {events.length > 1 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)]">
            Your Bookings
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Card
                key={ev.name}
                interactive
                onClick={() => navigate(`/?booking=${encodeURIComponent(ev.name)}`)}
                className={`p-4 space-y-2 ${ev.name === activeEvent?.name ? "border-[var(--ee-brand)] ring-1 ring-[var(--ee-brand)]" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm text-[var(--ee-text)]">{ev.event_name || ev.name}</h4>
                  <Badge variant="success" size="sm">{ev.status || "Confirmed"}</Badge>
                </div>
                <div className="text-xs text-[var(--ee-muted)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ev.event_date || "Date Pending"}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Money Summary & Planning Progress Rings */}
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
                  ${money?.owed || "0.00"}
                </span>
              </div>
              <div className="border-x border-[var(--ee-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">Paid So Far</span>
                <span className="font-mono font-bold text-base sm:text-lg tabular-nums text-[var(--ee-success)]">
                  ${money?.paid || "0.00"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">Balance Due</span>
                <span className="font-mono font-bold text-base sm:text-lg tabular-nums text-[var(--ee-brand)]">
                  ${money?.remaining || "0.00"}
                </span>
              </div>
            </div>
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
              title="Event Run Sheet"
              overallPercent={68}
              sections={[
                { id: "timeline", label: "Timeline & Ceremony", completed: true, percent: 100 },
                { id: "music", label: "Must-Play & Special Songs", completed: false, percent: 60 },
                { id: "vips", label: "VIP Announcements", completed: false, percent: 45 },
              ]}
              onSectionClick={() => navigate(`/planning?booking=${encodeURIComponent(activeEvent?.name || "")}`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
