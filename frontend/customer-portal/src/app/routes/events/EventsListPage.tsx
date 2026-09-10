import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Skeleton,
  EmptyState,
  call
} from "@portal-kit";
import {
  Calendar, MapPin, Clock, ArrowRight, Search,
  CheckCircle2, CreditCard, Sparkles, Filter
} from "lucide-react";
import { formatMoney } from "../../utils/money";

export const EventsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await call("frappe.client.get_list", {
          doctype: "Event Booking",
          fields: [
            "name", "event_name", "event_date", "status",
            "venue_address", "grand_total", "balance_due",
            "deposit_status", "weather_status", "weather_sensitive"
          ],
          order_by: "event_date asc",
          limit_page_length: 50,
        });
        setEvents(res || []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="10rem" />
          <Skeleton height="10rem" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      (ev.event_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue_address || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.name || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "upcoming") {
      return !ev.event_date || new Date(ev.event_date) >= now;
    }
    if (filter === "past") {
      return ev.event_date && new Date(ev.event_date) < now;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="My Events"
        subtitle="Manage upcoming entertainment bookings, review run sheets, and track payment schedules."
        badge={<Badge variant="brand">{events.length} Total</Badge>}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or venues..."
            density="consumer"
            leftIcon={<Search className="w-4 h-4 text-[var(--ee-muted)]" />}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {(["all", "upcoming", "past"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-[var(--ee-brand)] text-white shadow-sm"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const daysUntil = ev.event_date
              ? Math.ceil((new Date(ev.event_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null;

            const hasBalance = parseFloat(String(ev.balance_due || "0").replace(/[^0-9.]/g, "")) > 0;

            return (
              <Card key={ev.name} elevated className="p-5 space-y-4 hover:border-[var(--ee-brand-border)] transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" size="sm">
                        {daysUntil !== null && daysUntil >= 0
                          ? `${daysUntil} Days Away`
                          : "Past Event"}
                      </Badge>
                      <Badge variant="success" size="sm">{ev.status || "Confirmed"}</Badge>
                    </div>
                    <h3 className="font-bold text-base text-[var(--ee-text)]">
                      {ev.event_name || ev.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[var(--ee-muted)]">#{ev.name}</span>
                </div>

                <div className="space-y-1.5 text-xs text-[var(--ee-muted)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                    <span>{ev.event_date || "Date Pending"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                    <span>{ev.venue_address || "Venue details pending"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                    <span>
                      Total {formatMoney(ev.grand_total)} · Balance{" "}
                      <strong className={hasBalance ? "text-[var(--ee-brand)]" : "text-[var(--ee-success)]"}>
                        {formatMoney(ev.balance_due)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--ee-border)]">
                  <Button
                    variant="primary"
                    density="consumer"
                    onClick={() => navigate(`/events/${encodeURIComponent(ev.name)}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Event Hub
                  </Button>
                  <Button
                    variant="outline"
                    density="consumer"
                    onClick={() => navigate(`/planning?booking=${encodeURIComponent(ev.name)}`)}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Run Sheet
                  </Button>
                  {hasBalance && (
                    <Button
                      variant="ghost"
                      density="consumer"
                      onClick={() => navigate(`/pay?booking=${encodeURIComponent(ev.name)}`)}
                      className="text-[var(--ee-brand)] font-semibold"
                    >
                      Pay Due
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card elevated className="p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-[var(--ee-muted)] mx-auto" />
          <h4 className="font-semibold text-base text-[var(--ee-text)]">No events match your criteria</h4>
          <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
            Try adjusting your search terms or filter selection.
          </p>
        </Card>
      )}
    </div>
  );
};

export default EventsListPage;
