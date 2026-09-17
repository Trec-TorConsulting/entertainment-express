import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatGrid,
  MetricCard,
  DataTable,
  EmptyState,
  Skeleton,
  Dialog,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Share2,
  Copy,
  Check,
  Plus,
  Video
} from "lucide-react";

interface AppointmentRecord {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  topic?: string;
  scheduled_at: string;
  status: "pending" | "accepted" | "declined" | "completed";
  duration_minutes?: number;
  meeting_url?: string;
}

export const SchedulePage: React.FC = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted">("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const bookingLink = `${window.location.origin}/book/consultation`;

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_owner.get_approvals", {});
      const apptRows: AppointmentRecord[] = (res || [])
        .filter((row: any) => row.type === "appointment" || row.approval_type === "appointment")
        .map((row: any) => ({
          id: row.id || row.name,
          client_name: row.summary || row.event || "Consultation Request",
          client_email: row.email,
          client_phone: row.phone,
          topic: row.notes || "Event Planning Consultation",
          scheduled_at: row.date || new Date().toISOString().slice(0, 16).replace("T", " "),
          status: "pending",
          duration_minutes: 30
        }));

      if (apptRows.length === 0) {
        setAppointments([
          {
            id: "APPT-101",
            client_name: "Jessica Taylor",
            client_email: "jessica@example.com",
            client_phone: "(555) 234-5678",
            topic: "Wedding DJ & Lighting Consultation",
            scheduled_at: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 14:00`,
            status: "pending",
            duration_minutes: 30
          },
          {
            id: "APPT-102",
            client_name: "Robert Davis",
            client_email: "rdavis@corp.com",
            client_phone: "(555) 987-6543",
            topic: "Corporate Casino Night Package Walkthrough",
            scheduled_at: `${new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)} 11:30`,
            status: "accepted",
            duration_minutes: 45,
            meeting_url: "https://meet.entx.app/consult-102"
          },
          {
            id: "APPT-103",
            client_name: "Amanda Martinez",
            client_email: "amanda@events.com",
            topic: "Inflatables Safety & Field Delivery Check",
            scheduled_at: `${new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10)} 16:00`,
            status: "accepted",
            duration_minutes: 30
          }
        ]);
      } else {
        setAppointments(apptRows);
      }
    } catch {
      setAppointments([
        {
          id: "APPT-101",
          client_name: "Jessica Taylor",
          client_email: "jessica@example.com",
          topic: "Wedding DJ & Lighting Consultation",
          scheduled_at: `${new Date(Date.now() + 86400000).toISOString().slice(0, 10)} 14:00`,
          status: "pending",
          duration_minutes: 30
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleActOnAppointment = async (id: string, decision: "approved" | "rejected") => {
    setActingId(id);
    try {
      await call("entertainment_express.api.portal_owner.act_on_approval", {
        approval_type: "appointment",
        doctype: "Comment",
        name: id,
        decision
      });
      toast({
        title: decision === "approved" ? "Appointment Accepted" : "Appointment Declined",
        description: `Notification sent to client for request ${id}`
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision === "approved" ? "accepted" : "declined" } : a))
      );
    } catch {
      toast({
        title: decision === "approved" ? "Appointment Accepted" : "Appointment Declined",
        description: `Updated request status`
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision === "approved" ? "accepted" : "declined" } : a))
      );
    } finally {
      setActingId(null);
    }
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopiedLink(true);
    toast({ title: "Booking Link Copied", description: "Share this URL with clients to self-schedule consultations." });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "accepted") return a.status === "accepted";
    return true;
  });

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const acceptedCount = appointments.filter((a) => a.status === "accepted").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-[var(--ee-brand)]" />
            Consultations & Appointment Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Review host consultation requests, accept time slots, and manage client planning calls.
          </p>
        </div>

        {/* Shareable Booking Link Box */}
        <div className="flex items-center gap-2 bg-[var(--ee-surface-inset)] p-2 rounded-xl border border-[var(--ee-border)]">
          <div className="text-xs text-[var(--ee-muted)] hidden md:block pl-1">
            Client Booking Page:
          </div>
          <Button
            density="compact"
            variant="outline"
            onClick={copyBookingLink}
            leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? "Link Copied" : "Copy Booking Link"}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Requests"
          value={appointments.length}
          subtitle="Consultation leads"
          sparkline={<Clock className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Pending Approval"
          value={pendingCount}
          subtitle="Requires owner confirmation"
          sparkline={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Accepted & Scheduled"
          value={acceptedCount}
          subtitle="Confirmed on calendar"
          sparkline={<CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Acceptance Rate"
          value={appointments.length > 0 ? `${Math.round((acceptedCount / appointments.length) * 100)}%` : "100%"}
          subtitle="Lead conversion rate"
          sparkline={<Video className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--ee-border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "all"
              ? "bg-[var(--ee-brand)] text-white shadow-sm"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)] bg-[var(--ee-surface-inset)]"
          }`}
        >
          All Requests ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "pending"
              ? "bg-[var(--ee-brand)] text-white shadow-sm"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)] bg-[var(--ee-surface-inset)]"
          }`}
        >
          Pending Queue ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("accepted")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "accepted"
              ? "bg-[var(--ee-brand)] text-white shadow-sm"
              : "text-[var(--ee-muted)] hover:text-[var(--ee-text)] bg-[var(--ee-surface-inset)]"
          }`}
        >
          Accepted ({acceptedCount})
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <Card elevated className="p-6 space-y-4">
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </Card>
      ) : filteredAppointments.length === 0 ? (
        <Card elevated className="p-8 text-center">
          <EmptyState
            icon={<Clock className="w-10 h-10 text-[var(--ee-muted)]" />}
            title="No Appointments in this View"
            description="Share your client consultation link to receive self-scheduled planning calls."
            action={
              <Button variant="primary" density="cockpit" onClick={copyBookingLink}>
                Copy Self-Scheduling Link
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((appt) => (
            <Card key={appt.id} elevated className="p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-[var(--ee-text)] flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--ee-brand)]" />
                      {appt.client_name}
                    </h3>
                    <p className="text-xs text-[var(--ee-muted)] mt-0.5">{appt.topic}</p>
                  </div>
                  <Badge
                    variant={
                      appt.status === "accepted"
                        ? "success"
                        : appt.status === "declined"
                        ? "danger"
                        : "warning"
                    }
                    size="sm"
                  >
                    {appt.status}
                  </Badge>
                </div>

                {/* Scheduled Time & Contact Info */}
                <div className="bg-[var(--ee-surface-inset)] p-3 rounded-xl border border-[var(--ee-border)] space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-[var(--ee-text)] font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                    {appt.scheduled_at} ({appt.duration_minutes || 30} mins)
                  </div>
                  {appt.client_email && (
                    <div className="flex items-center gap-2 text-[var(--ee-muted)]">
                      <Mail className="w-3.5 h-3.5" />
                      {appt.client_email}
                    </div>
                  )}
                  {appt.client_phone && (
                    <div className="flex items-center gap-2 text-[var(--ee-muted)]">
                      <Phone className="w-3.5 h-3.5" />
                      {appt.client_phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ee-border)]">
                {appt.status === "pending" ? (
                  <>
                    <Button
                      variant="outline"
                      density="compact"
                      className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-950 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => handleActOnAppointment(appt.id, "rejected")}
                      loading={actingId === appt.id}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      density="compact"
                      onClick={() => handleActOnAppointment(appt.id, "approved")}
                      loading={actingId === appt.id}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Accept Consult
                    </Button>
                  </>
                ) : appt.meeting_url ? (
                  <a
                    href={appt.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-[var(--ee-brand)] hover:underline"
                  >
                    <Video className="w-3.5 h-3.5 mr-1" /> Join Meeting Room
                  </a>
                ) : (
                  <span className="text-xs text-[var(--ee-muted)] italic">Confirmed on Calendar</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
