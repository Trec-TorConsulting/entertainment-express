import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PageHeader,
  Tabs,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Alert,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  Calendar, MapPin, Clock, CloudRain, CheckCircle2,
  FileText, Users, Image, Shield, AlertTriangle
} from "lucide-react";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await call("frappe.client.get_list", {
          doctype: "Event Booking",
          fields: [
            "name", "event_name", "event_date", "status",
            "venue_address", "grand_total", "balance_due",
            "deposit_status", "weather_status", "weather_sensitive"
          ],
          filters: id ? [["name", "=", id]] : undefined,
          limit_page_length: 1,
        });

        const b = res?.[0] || {
          name: id || "EV-2026-001",
          event_name: "Summer Wedding & Reception",
          event_date: "2026-10-15",
          status: "Confirmed",
          venue_address: "100 River Rd, Austin TX",
          grand_total: "$3,200.00",
          balance_due: "$0.00"
        };
        setBooking(b);

        if (b.name) {
          const wx = await call("entertainment_express.api.weather.booking_weather", { booking: b.name }).catch(() => null);
          setWeather(wx || {
            forecast_summary: "60% chance of showers in evening",
            rain_date_offer: {
              can_accept: true,
              id: "OFFER-1",
              rain_date: "2026-10-16",
              notes: "Indoor ballroom backup secured at no additional charge."
            }
          });
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  const handleAcceptRainDate = async () => {
    try {
      await call("entertainment_express.api.weather.accept_rain_date", {
        offer: weather.rain_date_offer.id,
      });
      toast({
        title: "Rain Date Confirmed",
        description: `Your indoor backup date on ${weather.rain_date_offer.rain_date} is now active.`,
        variant: "success",
      });
      setWeather((prev: any) => prev ? { ...prev, rain_date_offer: null } : null);
    } catch (err: any) {
      toast({
        title: "Rain Date Acceptance Failed",
        description: err.message || "An error occurred.",
        variant: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="8rem" />
        <Skeleton height="16rem" />
      </div>
    );
  }

  // Calculate days until event
  const daysUntil = booking?.event_date
    ? Math.ceil((new Date(booking.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  const overviewTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base">Event Schedule & Logistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Date</span>
              <span className="font-semibold text-[var(--ee-text)]">{booking?.event_date}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Venue</span>
              <span className="font-semibold text-[var(--ee-text)]">{booking?.venue_address || "TBD"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Booking Status</span>
              <Badge variant="success" size="sm">{booking?.status || "Confirmed"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Contract Total</span>
              <span className="font-mono font-bold text-[var(--ee-text)]">{booking?.grand_total || "$0.00"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Remaining Balance</span>
              <span className="font-mono font-bold text-[var(--ee-brand)]">{booking?.balance_due || "$0.00"}</span>
            </div>
            <Button
              variant="outline"
              density="consumer"
              onClick={() => navigate(`/pay?booking=${encodeURIComponent(booking?.name || "")}`)}
              className="w-full mt-2"
            >
              View Invoices & Pay
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Sticky Event Flagship Header */}
      <div className="sticky top-0 z-20 bg-[var(--ee-surface-base)]/95 backdrop-blur-md pb-4 pt-2 border-b border-[var(--ee-border-subtle)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                {daysUntil > 0 ? `${daysUntil} Days Away` : "Today"}
              </Badge>
              <span className="text-xs font-mono text-[var(--ee-muted)]">ID: #{booking?.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ee-text)]">
              {booking?.event_name || "Event Details"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--ee-muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                {booking?.event_date}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                {booking?.venue_address}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              density="consumer"
              onClick={() => navigate(`/planning?booking=${encodeURIComponent(booking?.name || "")}`)}
            >
              Edit Run Sheet
            </Button>
          </div>
        </div>
      </div>

      {/* Rain Date Weather Review Banner */}
      {weather?.rain_date_offer?.can_accept && (
        <Alert
          variant="warning"
          title="Weather Advisory — Rain Date Backup Available"
          className="shadow-sm"
        >
          <div className="space-y-3 text-xs mt-1">
            <p>
              Weather forecast indicates rain ({weather.forecast_summary}). An alternate indoor date on{" "}
              <strong>{weather.rain_date_offer.rain_date}</strong> is held for you.
            </p>
            <div className="flex gap-2">
              <Button variant="primary" density="consumer" onClick={handleAcceptRainDate}>
                Accept Rain Date Protection
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Hub Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "overview", label: "Overview", icon: <CheckCircle2 className="w-4 h-4" />, content: overviewTab },
          { id: "planning", label: "Planning", icon: <FileText className="w-4 h-4" />, content: <p className="text-xs text-[var(--ee-muted)]">Planning items synced to the Run Sheet.</p> },
          { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" />, content: <p className="text-xs text-[var(--ee-muted)]">Signed agreements and receipts.</p> },
          { id: "crew", label: "Crew & Talent", icon: <Users className="w-4 h-4" />, content: <p className="text-xs text-[var(--ee-muted)]">Assigned entertainers and sound engineers.</p> },
          { id: "photos", label: "Gallery", icon: <Image className="w-4 h-4" />, content: <p className="text-xs text-[var(--ee-muted)]">Photo gallery downloads.</p> },
        ]}
      />
    </div>
  );
};
