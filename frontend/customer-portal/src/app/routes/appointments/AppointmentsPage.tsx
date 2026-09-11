import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Textarea,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  Clock, Calendar, Video, Phone, MapPin,
  Plus, CheckCircle2, XCircle, ArrowRight, Lock
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";
import { getSessionBootstrap } from "@portal-kit";

export const AppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("video");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const bookingParam = searchParams.get("booking");

  useEffect(() => {
    if (guest) {
      setLoading(false);
      return;
    }

    loadAppointments();
  }, [guest]);

  const loadAppointments = async () => {
    try {
      const res = await call("entertainment_express.api.appointments.my_appointments", {
        booking: bookingParam || ""
      });
      setAppointments(res || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookModal = async () => {
    setBookingModalOpen(true);
    try {
      const slots = await call("entertainment_express.api.appointments.available_slots", {
        booking: bookingParam || ""
      });
      setAvailableSlots(slots || []);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      toast({ title: "Select a Time Slot", description: "Please pick an available consultation time.", variant: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await call("entertainment_express.api.appointments.book_appointment", {
        slot: selectedSlot,
        appointment_type: appointmentType,
        notes: notes.trim(),
        booking: bookingParam || ""
      });

      toast({
        title: res?.status === "requested" ? "Consultation Requested" : "Consultation Booked",
        description: res?.status === "requested"
          ? "Your request has been submitted for owner review and acceptance."
          : "Your session is confirmed on our staff calendar and invite sent.",
        variant: "success",
      });
      setBookingModalOpen(false);
      setSelectedSlot("");
      setNotes("");
      await loadAppointments();
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description: err.message || "Could not complete consultation request. Please try again.",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    try {
      await call("entertainment_express.api.appointments.cancel_appointment", {
        appointment: apptId,
        reason: "Client requested cancellation"
      });
      toast({ title: "Meeting Cancelled", description: "Slot has been released.", variant: "brand" });
      await loadAppointments();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not cancel.", variant: "danger" });
    }
  };

  if (guest) {
    return (
      <Card elevated className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <Lock className="w-12 h-12 text-[var(--ee-muted)] mx-auto" />
        <h3 className="font-bold text-lg text-[var(--ee-text)]">Host-Only Consultations</h3>
        <p className="text-xs text-[var(--ee-muted)]">
          Scheduling formal production consultations and video walkthroughs is reserved for the primary host.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="12rem" />
          <Skeleton height="12rem" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Planning Consultations"
          subtitle="Meet 1-on-1 with your lead DJ, entertainment director, and production coordinator via video call or phone."
          badge={<Badge variant="brand">{appointments.length} Scheduled</Badge>}
        />
        <Button
          variant="primary"
          density="consumer"
          onClick={handleOpenBookModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm font-semibold"
        >
          Book Consultation
        </Button>
      </div>

      {/* Scheduled Appointments Grid */}
      {appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <Card key={appt.name || appt.id} elevated className="p-5 space-y-4 border-[var(--ee-border)]">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        appt.status === "cancelled" || appt.status === "canceled"
                          ? "danger"
                          : appt.status === "requested"
                          ? "warning"
                          : "success"
                      }
                      size="sm"
                    >
                      {appt.status === "requested" ? "Pending Confirmation" : appt.status === "scheduled" ? "Confirmed" : appt.status || "Scheduled"}
                    </Badge>
                    {appt.event_booking && (
                      <Badge variant="outline" size="sm">
                        {appt.event_booking}
                      </Badge>
                    )}
                    <span className="text-xs font-mono text-[var(--ee-muted)]">#{appt.name || appt.id}</span>
                  </div>
                  <h4 className="font-semibold text-base text-[var(--ee-text)]">
                    {appt.subject || "Event Planning Session"}
                  </h4>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--ee-muted)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                  <span>{appt.start_time || "Time Confirmed"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {appt.appointment_type === "phone" ? (
                    <Phone className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                  )}
                  <span>
                    Format: {appt.appointment_type === "phone" ? "Phone Call" : "Google Meet Video"} · With{" "}
                    {appt.host_name || "Event Director"}
                  </span>
                </div>
                {appt.notes && (
                  <p className="text-[11px] text-[var(--ee-text)] pt-1 italic">
                    "{appt.notes}"
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--ee-border)]">
                {appt.meet_url ? (
                  <a
                    href={appt.meet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--ee-brand)] text-white hover:opacity-90 transition-opacity"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Video Call
                  </a>
                ) : null}
                <Button
                  variant="outline"
                  density="consumer"
                  onClick={() => handleCancelAppointment(appt.name || appt.id)}
                  className="text-[var(--ee-danger)] hover:border-[var(--ee-danger)] text-xs"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card elevated className="p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 text-[var(--ee-muted)] mx-auto" />
          <div className="space-y-1">
            <h4 className="font-semibold text-base text-[var(--ee-text)]">No consultations scheduled</h4>
            <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
              Ready to review your music vibe, ceremony cues, or venue setup? Book a free 30-minute planning session with our team.
            </p>
          </div>
          <Button
            variant="primary"
            density="consumer"
            onClick={handleOpenBookModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule Your Consultation
          </Button>
        </Card>
      )}

      {/* Booking Consultation Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card elevated className="max-w-md w-full p-6 space-y-5 bg-[var(--ee-surface-raised)] animate-in fade-in-50">
            <div className="flex justify-between items-center border-b border-[var(--ee-border)] pb-3">
              <h3 className="font-bold text-base text-[var(--ee-text)]">Book a Planning Consultation</h3>
              <Badge variant="brand" size="sm">Free 30 Mins</Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ee-text)]">Meeting Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppointmentType("video")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      appointmentType === "video"
                        ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand)]"
                        : "border-[var(--ee-border)] text-[var(--ee-muted)]"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType("phone")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      appointmentType === "phone"
                        ? "border-[var(--ee-brand)] bg-[var(--ee-brand-soft)]/40 text-[var(--ee-brand)]"
                        : "border-[var(--ee-border)] text-[var(--ee-muted)]"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Phone Call
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ee-text)]">Available Staff Time Slots</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-all ${
                        selectedSlot === slot.id
                          ? "border-[var(--ee-brand)] bg-[var(--ee-brand)] text-white font-semibold"
                          : "border-[var(--ee-border)] hover:bg-[var(--ee-surface-base)] text-[var(--ee-text)]"
                      }`}
                    >
                      <span>{slot.label || slot.start || slot.id}</span>
                      {selectedSlot === slot.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  ))}
                </div>
              </div>

              <FormField label="Discussion Topics & Special Questions">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What would you like to review? (E.g., timeline review, song lists, venue load-in)..."
                  density="consumer"
                  rows={3}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--ee-border)]">
              <Button variant="outline" density="consumer" onClick={() => setBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                density="consumer"
                onClick={handleBookAppointment}
                disabled={submitting || !selectedSlot}
              >
                {submitting ? "Booking…" : "Confirm Appointment"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
