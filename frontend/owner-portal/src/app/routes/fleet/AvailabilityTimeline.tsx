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
  useToast,
  call
} from "@portal-kit";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { QuarantineDrawer } from "./QuarantineDrawer";

interface TimelineReservation {
  name: string;
  booking: string;
  item_code: string;
  reserved_qty: number;
  event_start: string;
  event_end: string;
  buffer_start: string;
  buffer_end: string;
  status: string;
}

interface TimelineQuarantine {
  name: string;
  item_code: string;
  asset?: string;
  reason: string;
  quarantine_status: string;
  flagged_datetime?: string;
}

export const AvailabilityTimeline: React.FC = () => {
  const { toast } = useToast();
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [quarantineOpen, setQuarantineOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<TimelineReservation[]>([]);
  const [quarantines, setQuarantines] = useState<TimelineQuarantine[]>([]);

  const loadTimelineData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + rangeDays * 86400000);
      const res = await call("entertainment_express.equipment_fleet.api.get_timeline_availability_matrix", {
        start_date: now.toISOString(),
        end_date: end.toISOString()
      });
      if (res) {
        setReservations(res.reservations || defaultReservations);
        setQuarantines(res.quarantines || defaultQuarantines);
      } else {
        setReservations(defaultReservations);
        setQuarantines(defaultQuarantines);
      }
    } catch {
      setReservations(defaultReservations);
      setQuarantines(defaultQuarantines);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineData();
  }, [rangeDays]);

  const defaultReservations: TimelineReservation[] = [
    {
      name: "RES-001",
      booking: "BOOKING-9941",
      item_code: "BH-BOUNCE-75",
      reserved_qty: 1,
      event_start: "2035-06-01T13:00:00",
      event_end: "2035-06-01T17:00:00",
      buffer_start: "2035-06-01T12:00:00",
      buffer_end: "2035-06-02T10:00:00",
      status: "Reserved"
    },
    {
      name: "RES-002",
      booking: "BOOKING-9942",
      item_code: "SPK-QSC-K12",
      reserved_qty: 2,
      event_start: "2035-06-02T16:00:00",
      event_end: "2035-06-02T22:00:00",
      buffer_start: "2035-06-02T15:00:00",
      buffer_end: "2035-06-03T02:00:00",
      status: "Reserved"
    }
  ];

  const defaultQuarantines: TimelineQuarantine[] = [
    {
      name: "QRT-001",
      item_code: "BH-BOUNCE-75",
      asset: "75ft Tropical Water Obstacle",
      reason: "Damage",
      quarantine_status: "Quarantined",
      flagged_datetime: "2035-05-30T10:00:00"
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-[var(--ee-brand)]" />
            Temporal Resource Availability Matrix
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Gantt-style timeline tracking equipment bookings, turnaround buffers, and maintenance quarantine locks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            density="compact"
            onClick={() => setQuarantineOpen(true)}
            leftIcon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
          >
            Quarantine Vault ({quarantines.length})
          </Button>
        </div>
      </div>

      {/* Date Scrubber & Filters */}
      <Card elevated className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--ee-text)] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--ee-brand)]" /> Range Scrubber:
          </span>
          {[
            { label: "Next 3 Days", days: 3 },
            { label: "Next 7 Days", days: 7 },
            { label: "Next 30 Days", days: 30 }
          ].map((btn) => (
            <Button
              key={btn.days}
              density="compact"
              variant={rangeDays === btn.days ? "primary" : "outline"}
              onClick={() => setRangeDays(btn.days)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-[var(--ee-text)] font-medium">Event Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-[var(--ee-text)] font-medium">Turnaround Buffer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span className="text-[var(--ee-text)] font-medium">Quarantine Lock</span>
          </div>
        </div>
      </Card>

      {/* Gantt Resource Grid */}
      <Card elevated className="p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--ee-border)] pb-4">
          <h3 className="font-bold text-base text-[var(--ee-text)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--ee-brand)]" />
            Resource Reservation Grid ({reservations.length + quarantines.length} Active Blocks)
          </h3>
          <span className="text-xs text-[var(--ee-muted)] font-mono">
            Window: Today + {rangeDays} Days
          </span>
        </div>

        <div className="space-y-4">
          {[
            { code: "BH-BOUNCE-75", title: "75ft Tropical Water Obstacle Course", category: "Inflatables" },
            { code: "SPK-QSC-K12", title: "QSC K12.2 Active Powered Speaker Pair", category: "Audio & Sound" },
            { code: "LGT-CHAUVET-260", title: "Chauvet Intimidator Spot 260 Pair", category: "Lighting & FX" },
            { code: "DJ-OPUS-QUAD", title: "Pioneer DJ OPUS-QUAD All-In-One", category: "DJ Gear" }
          ].map((item) => {
            const itemResv = reservations.filter((r) => r.item_code === item.code);
            const itemQuar = quarantines.filter((q) => q.item_code === item.code);

            return (
              <div key={item.code} className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--ee-brand)] font-bold uppercase tracking-wider">
                      {item.category} • {item.code}
                    </span>
                    <h4 className="font-bold text-sm text-[var(--ee-text)]">{item.title}</h4>
                  </div>
                  {itemQuar.length > 0 ? (
                    <Badge variant="danger" size="sm">
                      Quarantined ({itemQuar[0].reason})
                    </Badge>
                  ) : itemResv.length > 0 ? (
                    <Badge variant="warning" size="sm">
                      Turnaround Buffer Active
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      100% Available
                    </Badge>
                  )}
                </div>

                {/* Simulated Timeline Bar */}
                <div className="h-7 w-full bg-[var(--ee-surface)] rounded-lg border border-[var(--ee-border)] relative overflow-hidden flex items-center p-1 gap-1">
                  {itemQuar.length > 0 ? (
                    <div className="h-full w-full bg-rose-500/20 border border-rose-500/40 rounded flex items-center justify-center text-xs font-bold text-rose-500">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Maintenance Quarantine Lock
                    </div>
                  ) : itemResv.length > 0 ? (
                    <>
                      <div className="h-full w-1/3 bg-blue-500/20 border border-blue-500/40 rounded flex items-center px-2 text-[11px] font-bold text-blue-400">
                        {itemResv[0].booking}
                      </div>
                      <div className="h-full w-1/2 bg-amber-500/20 border border-amber-500/40 rounded flex items-center px-2 text-[11px] font-bold text-amber-400">
                        Prep & Sanitization Buffer (18h)
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-[var(--ee-muted)]">
                      No Reservation Conflicts — Open for Bookings
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quarantine Vault Drawer */}
      <QuarantineDrawer
        open={quarantineOpen}
        onClose={() => setQuarantineOpen(false)}
        onRefresh={loadTimelineData}
      />
    </div>
  );
};

export default AvailabilityTimeline;
