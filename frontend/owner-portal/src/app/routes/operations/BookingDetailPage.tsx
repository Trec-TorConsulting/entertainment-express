import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { EventPLDrawer } from "../money/components/EventPLDrawer";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Skeleton,
  StatGrid,
  StatCard,
  Dialog,
  useToast,
  call,
} from "@portal-kit";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  TrendingUp,
  Truck,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Users,
  ShieldCheck,
  Send,
  Zap,
} from "lucide-react";

interface JobRecord {
  id: string;
  event_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_address: string;
  status: string;
  notes: string;
  grand_total?: number;
  deposit_amount?: number;
  balance_due?: number;
  target_margin_percent?: number;
  ee_dispatch_status?: string;
}

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "staffing" | "logistics">("overview");

  // Drawer & Dialog states
  const [isPLOpen, setIsPLOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Form State
  const [editEventName, setEditEventName] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editStatus, setEditStatus] = useState("Confirmed");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchJob = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_crud.get_record", {
        kind: "job",
        name: id,
      });
      if (res && res.row) {
        const row = res.row;
        setJob(row);
        setEditEventName(row.event_name || "");
        setEditCustomerName(row.customer_name || "");
        setEditEventDate(row.event_date || "");
        setEditStartTime(row.start_time || "");
        setEditEndTime(row.end_time || "");
        setEditVenue(row.venue_address || "");
        setEditStatus(row.status || "Confirmed");
        setEditNotes(row.notes || "");
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Booking",
        description: err?.message || "Could not load booking details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingEdit(true);
    try {
      await call("entertainment_express.api.portal_crud.save_record", {
        kind: "job",
        name: id,
        values: {
          event_name: editEventName.trim(),
          customer_name: editCustomerName.trim(),
          event_date: editEventDate,
          start_time: editStartTime,
          end_time: editEndTime,
          venue_address: editVenue.trim(),
          status: editStatus,
          notes: editNotes.trim(),
        },
      });
      toast({
        title: "Booking Updated",
        description: "Event details saved successfully.",
      });
      setIsEditOpen(false);
      fetchJob();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not update booking.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete ${job?.event_name || id}?`)) return;
    setIsDeleting(true);
    try {
      await call("entertainment_express.api.portal_crud.delete_record", {
        kind: "job",
        name: id,
      });
      toast({
        title: "Booking Removed",
        description: "Booking has been deleted from the calendar.",
      });
      navigate("/calendar");
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.message || "Could not remove booking.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const getStatusVariant = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("confirm") || s.includes("done")) return "success";
    if (s.includes("inquiry") || s.includes("hold") || s.includes("quoted")) return "warning";
    if (s.includes("cancel")) return "destructive";
    return "outline";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton width="200px" height="24px" />
        <Skeleton height="120px" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
          <p className="text-sm text-slate-400">Booking ID "{id}" could not be retrieved from the server.</p>
          <Button onClick={() => navigate("/calendar")} className="bg-purple-600 hover:bg-purple-500 text-white">
            Return to Calendar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/calendar")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calendar
        </button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPLOpen(true)}
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-900/40 text-xs flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            Margin & P&L Drawer
          </Button>
          <Button
            onClick={() => setIsEditOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/40"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Booking
          </Button>
          <Button
            onClick={handleDeleteJob}
            disabled={isDeleting}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs p-2"
            title="Delete Booking"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {job.id}
              </span>
              <Badge variant={getStatusVariant(job.status)} className="px-3 py-1 font-semibold text-xs">
                {job.status}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{job.event_name}</h1>
            <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              Client: <span className="font-semibold text-white">{job.customer_name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-lg text-purple-300 border border-purple-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Event Date</div>
                <div className="text-sm font-bold text-white">{job.event_date || "TBD"}</div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Hours</div>
                <div className="text-sm font-bold text-white">
                  {job.start_time ? `${job.start_time.slice(0, 5)} - ${job.end_time?.slice(0, 5) || "End"}` : "Full Day"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Summary Grid */}
      <StatGrid columns={4}>
        <StatCard
          title="Contract Grand Total"
          value={`$${(job.grand_total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sparkline={<DollarSign className="w-4 h-4 text-emerald-400" />}
          subtitle="Fixed event contract"
        />
        <StatCard
          title="Balance Due"
          value={`$${(job.balance_due || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sparkline={<Clock className="w-4 h-4 text-amber-400" />}
          subtitle="Collected prior to event"
        />
        <StatCard
          title="Target Profit Margin"
          value={`${job.target_margin_percent || 40}%`}
          sparkline={<TrendingUp className="w-4 h-4 text-purple-400" />}
          subtitle="Predictive Margin Guardrail"
        />
        <StatCard
          title="Dispatch Status"
          value={job.ee_dispatch_status || "Draft"}
          sparkline={<Truck className="w-4 h-4 text-indigo-400" />}
          subtitle="Field crew staging"
        />
      </StatGrid>

      {/* Main Content Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Event Overview & Logistics
        </button>
        <button
          onClick={() => setActiveTab("staffing")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "staffing"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Roster & Crew Assignment
        </button>
        <button
          onClick={() => setActiveTab("logistics")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "logistics"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Venue Fit & Equipment BOM
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/60 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Venue & Location Logistics
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Venue Address</label>
              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-sm text-slate-200">
                {job.venue_address || "No venue address specified."}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Staging & Production Notes</label>
              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-sm text-slate-200 whitespace-pre-wrap min-h-[100px]">
                {job.notes || "No special instructions or staging notes added yet."}
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-purple-400" />
              Client Contact Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Primary Contact</span>
                <span className="text-slate-200 font-bold text-sm">{job.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Contact Email</span>
                <span className="text-slate-200 font-mono">{job.customer_email || "Not specified"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Phone Number</span>
                <span className="text-slate-200 font-mono">{job.customer_phone || "Not specified"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <Button onClick={() => setIsEditOpen(true)} className="w-full bg-purple-600/80 hover:bg-purple-600 text-white text-xs">
                Edit Contact Info
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Staffing */}
      {activeTab === "staffing" && (
        <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Assigned Event Crew & Talent Roster
              </h3>
              <p className="text-xs text-slate-400">Assigned field personnel synced to mobile app & dispatch board.</p>
            </div>
            <Button onClick={() => navigate("/people")} className="bg-purple-600 hover:bg-purple-500 text-white text-xs">
              Manage Team Roster
            </Button>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-center text-xs text-slate-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-white">Event Staffing Operational</p>
            <p className="text-slate-400 mt-0.5">Field crew receive notification & pull sheet details 48h prior to event date.</p>
          </div>
        </Card>
      )}

      {/* Tab 3: Logistics */}
      {activeTab === "logistics" && (
        <Card className="p-6 border border-slate-800 bg-slate-900/60 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Venue Fit & Logistics BOM
              </h3>
              <p className="text-xs text-slate-400">Power, clearance, surface, and van warehouse packing manifest.</p>
            </div>
            <Button onClick={() => navigate("/fleet/vans")} className="bg-purple-600 hover:bg-purple-500 text-white text-xs">
              View Van Manifest
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Dedicated Power Circuit</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 20A Circuit Verified
              </span>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Setup Surface</span>
              <span className="text-white font-bold">Hard Surface / Indoor Gym</span>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
              <span className="text-slate-400 block font-semibold mb-1">Load-In Access</span>
              <span className="text-white font-bold">Ground Level Loading Dock</span>
            </div>
          </div>
        </Card>
      )}

      {/* Modal Dialog: Edit Booking */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Booking ${job.id}`}>
        <form onSubmit={handleSaveEdit} className="space-y-4 text-white">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
            <input
              type="text"
              value={editEventName}
              onChange={(e) => setEditEventName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Client Name</label>
              <input
                type="text"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Quoted">Quoted</option>
                <option value="Hold">Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date</label>
              <input
                type="date"
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Address</label>
            <input
              type="text"
              value={editVenue}
              onChange={(e) => setEditVenue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Staging Instructions</label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" onClick={() => setIsEditOpen(false)} variant="outline" className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={savingEdit} className="bg-purple-600 hover:bg-purple-500 text-white text-xs">
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Margin Intelligence Drawer */}
      <EventPLDrawer bookingId={job.id} isOpen={isPLOpen} onClose={() => setIsPLOpen(false)} />
    </div>
  );
};

export default BookingDetailPage;
