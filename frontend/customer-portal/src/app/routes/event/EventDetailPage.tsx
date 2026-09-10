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
  call,
  downloadBase64
} from "@portal-kit";
import {
  Calendar, MapPin, Clock, CloudRain, CheckCircle2,
  FileText, Users, Image, Shield, AlertTriangle,
  CreditCard, Music, Sparkles, MessageSquare, Download,
  ExternalLink, UserPlus, FileCheck, ArrowRight
} from "lucide-react";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [planningForms, setPlanningForms] = useState<any[]>([]);
  const [musicList, setMusicList] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const res = await call("frappe.client.get_list", {
          doctype: "Event Booking",
          fields: [
            "name", "event_name", "event_date", "status",
            "venue_address", "grand_total", "balance_due",
            "deposit_status", "weather_status", "weather_sensitive",
            "start_time", "end_time", "guest_count", "special_instructions"
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
          balance_due: "$0.00",
          start_time: "17:00:00",
          end_time: "23:00:00",
          guest_count: 140
        };
        setBooking(b);

        if (b.name) {
          const [wxRes, contRes, invRes, formsRes, musicRes, delivRes, invsRes] = await Promise.allSettled([
            call("entertainment_express.api.weather.booking_weather", { booking: b.name }),
            call("entertainment_express.api.portal_client.list_contracts", {}),
            call("entertainment_express.api.portal_client.list_invoices", {}),
            call("entertainment_express.api.planning.list_forms", { booking_name: b.name }),
            call("entertainment_express.api.music.list_selections", { booking_name: b.name }),
            call("entertainment_express.api.deliverables.list_deliverables", { booking: b.name }),
            call("entertainment_express.api.portal_collaboration.list_invites", { booking: b.name })
          ]);

          if (wxRes.status === "fulfilled") setWeather(wxRes.value);
          if (contRes.status === "fulfilled") setContracts(contRes.value || []);
          if (invRes.status === "fulfilled") setInvoices(invRes.value || []);
          if (formsRes.status === "fulfilled") setPlanningForms(formsRes.value || []);
          if (musicRes.status === "fulfilled") setMusicList(musicRes.value || []);
          if (delivRes.status === "fulfilled") setDeliverables(delivRes.value || []);
          if (invsRes.status === "fulfilled") setInvites(invsRes.value || []);
        }
      } catch {
        // graceful
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [id]);

  const handleAcceptRainDate = async () => {
    try {
      await call("entertainment_express.api.weather.accept_rain_date", {
        offer: weather.rain_date_offer.id,
      });
      toast({
        title: "Rain Date Confirmed",
        description: `Your indoor backup date on ${weather.rain_date_offer.rain_date} is now locked in.`,
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

  const downloadFile = async (row: any) => {
    try {
      const file = await call("entertainment_express.api.deliverables.get_deliverable", { name: row.id || row.name });
      downloadBase64(file.filename || row.title || "deliverable", file.content_b64, file.mime || "application/octet-stream");
    } catch (err: any) {
      toast({ title: "Download Failed", description: err.message || "Could not download file.", variant: "danger" });
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

  const relevantContracts = contracts.filter((c) => !c.event || c.event === booking?.name || c.event === booking?.event_name);
  const relevantInvoices = invoices.filter((inv) => !inv.event || inv.event === booking?.event_name || inv.id);

  // Overview Tab
  const overviewTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--ee-brand)]" />
              Event Schedule & Venue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Event Date</span>
              <span className="font-semibold text-[var(--ee-text)]">{booking?.event_date}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Time Window</span>
              <span className="font-semibold text-[var(--ee-text)]">
                {booking?.start_time ? `${booking.start_time.slice(0, 5)} - ${booking.end_time?.slice(0, 5) || "End"}` : "Evening Performance"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Venue Location</span>
              <span className="font-semibold text-[var(--ee-text)]">{booking?.venue_address || "TBD"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Expected Guests</span>
              <span className="font-semibold text-[var(--ee-text)]">{booking?.guest_count || "120"} guests</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--ee-muted)]">Booking Status</span>
              <Badge variant="success" size="sm">{booking?.status || "Confirmed"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--ee-brand)]" />
                Financial Overview
              </span>
              <Button
                variant="ghost"
                density="consumer"
                onClick={() => navigate(`/pay?booking=${encodeURIComponent(booking?.name || "")}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Invoices
              </Button>
            </CardTitle>
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
            <div className="flex justify-between py-1.5 border-b border-[var(--ee-border)]">
              <span className="text-[var(--ee-muted)]">Deposit Status</span>
              <Badge variant={booking?.deposit_status === "paid" ? "success" : "warning"} size="sm">
                {booking?.deposit_status || "Pending"}
              </Badge>
            </div>
            <Button
              variant="primary"
              density="consumer"
              onClick={() => navigate(`/pay?booking=${encodeURIComponent(booking?.name || "")}`)}
              className="w-full mt-2"
            >
              Pay Balance / View Invoices
            </Button>
          </CardContent>
        </Card>
      </div>

      {booking?.special_instructions && (
        <Card elevated className="p-4 bg-[var(--ee-surface-inset)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] mb-1">
            Special Notes & Logistics
          </h4>
          <p className="text-xs text-[var(--ee-text)] leading-relaxed">
            {booking.special_instructions}
          </p>
        </Card>
      )}
    </div>
  );

  // Planning Tab
  const planningTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[var(--ee-brand)]" />
                Music Selections
              </span>
              <Badge variant="brand" size="sm">{musicList.length} Songs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--ee-muted)]">
              Must-play hits, special moment cues (First Dance, Grand Entrance), and do-not-play lists.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="primary"
                density="consumer"
                onClick={() => navigate(`/planning?booking=${encodeURIComponent(booking?.name || "")}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Manage Song Lists
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ee-brand)]" />
                Run of Show & Timeline
              </span>
              <Badge variant="success" size="sm">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--ee-muted)]">
              Chronological schedule of ceremonies, announcements, toasts, and dancing sets.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                density="consumer"
                onClick={() => navigate(`/planning?booking=${encodeURIComponent(booking?.name || "")}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View & Suggest Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {planningForms.length > 0 && (
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--ee-brand)]" />
              Event Questionnaires ({planningForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planningForms.map((f: any) => (
              <div key={f.name} className="flex items-center justify-between p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
                <div>
                  <h5 className="text-xs font-semibold text-[var(--ee-text)]">{f.template_name || "Event Questionnaire"}</h5>
                  <span className="text-[10px] text-[var(--ee-muted)]">{f.purpose || "Event details"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={Number(f.completion_percent) >= 100 ? "success" : "brand"} size="sm">
                    {f.completion_percent || 0}% Complete
                  </Badge>
                  <Button
                    variant="ghost"
                    density="consumer"
                    onClick={() => navigate(`/planning?booking=${encodeURIComponent(booking?.name || "")}`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Documents Tab
  const documentsTab = (
    <div className="space-y-4">
      {relevantContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantContracts.map((c: any) => (
            <Card key={c.id} elevated className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant={c.can_sign ? "warning" : "success"} size="sm">
                    {c.can_sign ? "Signature Required" : "Signed & Executed"}
                  </Badge>
                  <h4 className="font-semibold text-sm text-[var(--ee-text)]">{c.title || c.id}</h4>
                  <p className="text-xs text-[var(--ee-muted)]">Signer: {c.signer_name || "Client"}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {c.can_sign ? (
                  <Button
                    variant="primary"
                    density="consumer"
                    className="w-full"
                    onClick={() => navigate(`/documents?booking=${encodeURIComponent(booking?.name || "")}`)}
                  >
                    Review & Sign Now
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    density="consumer"
                    className="w-full"
                    onClick={() => navigate(`/documents?booking=${encodeURIComponent(booking?.name || "")}`)}
                    leftIcon={<FileCheck className="w-4 h-4" />}
                  >
                    View Executed Agreement
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card elevated className="p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-[var(--ee-muted)] mx-auto" />
          <h4 className="font-semibold text-sm text-[var(--ee-text)]">No pending contracts</h4>
          <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
            All documents and contracts for this event have been verified.
          </p>
          <Button variant="outline" density="consumer" onClick={() => navigate("/documents")}>
            Open Documents Hub
          </Button>
        </Card>
      )}
    </div>
  );

  // Team & Collaboration Tab
  const teamTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--ee-brand)]" />
                Entertainment & Crew Team
              </span>
              <Badge variant="brand" size="sm">Assigned</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
              <div className="w-10 h-10 rounded-full bg-[var(--ee-brand-soft)] text-[var(--ee-brand-text)] flex items-center justify-center font-bold">
                DJ
              </div>
              <div>
                <h5 className="text-xs font-semibold text-[var(--ee-text)]">Lead Entertainer / MC</h5>
                <span className="text-[10px] text-[var(--ee-muted)]">Assigned & Prepped for Your Set</span>
              </div>
            </div>
            <Button
              variant="outline"
              density="consumer"
              className="w-full"
              onClick={() => navigate(`/chat?booking=${encodeURIComponent(booking?.name || "")}`)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Message Your Team
            </Button>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[var(--ee-brand)]" />
                Co-Hosts & Guests ({invites.length})
              </span>
              <Button
                variant="ghost"
                density="consumer"
                onClick={() => navigate(`/people?booking=${encodeURIComponent(booking?.name || "")}`)}
              >
                Manage
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--ee-muted)]">
              Invite wedding party members, co-planners, and friends to suggest songs and vote on activities.
            </p>
            <Button
              variant="primary"
              density="consumer"
              className="w-full"
              onClick={() => navigate(`/people?booking=${encodeURIComponent(booking?.name || "")}`)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite Collaborators
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Photos & Media Tab
  const photosTab = (
    <div className="space-y-4">
      {deliverables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {deliverables.map((item: any) => (
            <Card key={item.id} elevated className="p-4 space-y-3">
              <div className="w-full h-32 rounded-lg bg-[var(--ee-surface-inset)] flex items-center justify-center border border-[var(--ee-border)]">
                <Image className="w-8 h-8 text-[var(--ee-muted)]" />
              </div>
              <div>
                <h5 className="font-semibold text-xs text-[var(--ee-text)] truncate">{item.title}</h5>
                <span className="text-[10px] text-[var(--ee-muted)]">{item.kind || "Photo"}</span>
              </div>
              <Button
                variant="outline"
                density="consumer"
                className="w-full"
                onClick={() => downloadFile(item)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card elevated className="p-8 text-center space-y-3">
          <Image className="w-10 h-10 text-[var(--ee-muted)] mx-auto" />
          <h4 className="font-semibold text-sm text-[var(--ee-text)]">Photo gallery in progress</h4>
          <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
            High-resolution event photography and photo booth prints will be published here following the event.
          </p>
          <Button variant="outline" density="consumer" onClick={() => navigate("/photos")}>
            Open Photos Gallery
          </Button>
        </Card>
      )}
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
                {daysUntil > 0 ? `${daysUntil} Days Away` : daysUntil === 0 ? "Event Day Today!" : "Completed Event"}
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

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              density="consumer"
              onClick={() => navigate(`/chat?booking=${encodeURIComponent(booking?.name || "")}`)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Event Chat
            </Button>
            <Button
              variant="primary"
              density="consumer"
              onClick={() => navigate(`/planning?booking=${encodeURIComponent(booking?.name || "")}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Planning Hub
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
              Weather forecast indicates chance of precipitation ({weather.forecast_summary}). An alternate indoor date on{" "}
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
          { id: "planning", label: "Planning", icon: <Sparkles className="w-4 h-4" />, content: planningTab },
          { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" />, content: documentsTab },
          { id: "crew", label: "Team & Guests", icon: <Users className="w-4 h-4" />, content: teamTab },
          { id: "photos", label: "Photos & Media", icon: <Image className="w-4 h-4" />, content: photosTab },
        ]}
      />
    </div>
  );
};

export default EventDetailPage;
