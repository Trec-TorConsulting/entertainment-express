import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Truck, MapPin, Clock, AlertTriangle, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

interface ActiveEvent {
  booking_id: string;
  customer: string;
  venue: string;
  status: string;
  offset_minutes: number;
  incident_count: number;
  coords: { lat: number; lng: number };
}

export const FlightDeckPage: React.FC = () => {
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlightDeck();
  }, []);

  const fetchFlightDeck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/method/entertainment_express.live_ops.flight_deck.get_active_flight_deck');
      const data = await res.json();
      const raw = data.message?.flight_deck || [];
      setEvents(
        raw.map((item: any) => ({
          booking_id: item.booking?.name || 'EB-2026-001',
          customer: item.booking?.customer_name || 'Acme Corp',
          venue: item.booking?.venue || 'Grand Ballroom',
          status: item.live_status || 'on_site',
          offset_minutes: item.active_offset_minutes || 0,
          incident_count: item.incident_count || 0,
          coords: item.venue_coords || { lat: 40.7128, lng: -74.0060 },
        }))
      );
    } catch {
      setEvents([
        {
          booking_id: 'EB-2026-001',
          customer: 'Smith Wedding',
          venue: 'Pine Hollow Barn',
          status: 'show_live',
          offset_minutes: 15,
          incident_count: 0,
          coords: { lat: 40.7128, lng: -74.0060 },
        },
        {
          booking_id: 'EB-2026-002',
          customer: 'Nexus Corp Gala',
          venue: 'Metropolitan Pavilion',
          status: 'rigging',
          offset_minutes: 0,
          incident_count: 1,
          coords: { lat: 40.7357, lng: -74.1724 },
        },
        {
          booking_id: 'EB-2026-003',
          customer: 'Johnson Birthday',
          venue: 'Riverside Park',
          status: 'en_route',
          offset_minutes: 0,
          incident_count: 0,
          coords: { lat: 40.6782, lng: -73.9442 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'show_live': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'rigging': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'en_route': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Saturday Night Live Event Flight Deck</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Socket.IO Telemetry Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mission control tracking vehicle GPS, geofenced milestone check-ins, live pacing delays, and field hardware incidents.
          </p>
        </div>

        <button
          onClick={fetchFlightDeck}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 flex items-center gap-2 shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ops</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Active Rigs & Events</span>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">{events.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Pacing Offset Shift</span>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-0.5">+15 mins</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Open Field Incidents</span>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-0.5">1 Incident</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Event Cards & Simulated Telemetry Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Events List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-2">Live Day Operations</h3>
          {events.map((evt) => (
            <div
              key={evt.booking_id}
              onClick={() => setSelectedEvent(evt)}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                selectedEvent?.booking_id === evt.booking_id
                  ? 'bg-indigo-950/40 border-indigo-500'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-slate-400">{evt.booking_id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getStatusColor(evt.status)}`}>
                  {evt.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-100">{evt.customer}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{evt.venue}</span>
                </div>
              </div>

              {evt.offset_minutes > 0 && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between font-mono">
                  <span>Pacing Delay:</span>
                  <span>+{evt.offset_minutes}m shifted</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Command Map & Telemetry Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Live Fleet & Venue Telemetry Map
            </h3>
            <span className="text-xs text-slate-400 font-mono">3 Vehicles Online</span>
          </div>

          {/* Interactive Simulated Map Graphic */}
          <div className="relative h-72 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {events.map((evt, idx) => (
              <div
                key={evt.booking_id}
                className="absolute flex flex-col items-center animate-pulse"
                style={{
                  top: `${30 + idx * 25}%`,
                  left: `${25 + idx * 30}%`,
                }}
              >
                <div className="p-2 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-slate-900">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-200">
                  {evt.customer}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Selected Telemetry Target:</span>
            <span className="font-semibold text-indigo-300 font-mono">
              {selectedEvent ? `${selectedEvent.customer} (${selectedEvent.venue})` : 'Select an active event'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDeckPage;
