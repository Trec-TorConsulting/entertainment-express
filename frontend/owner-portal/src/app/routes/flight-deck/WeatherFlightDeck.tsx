import React, { useState } from 'react';
import BroadcastAlertModal from './BroadcastAlertModal';

interface OutdoorEventRisk {
  bookingId: string;
  eventName: string;
  eventDate: string;
  windMph: number;
  precipInch: number;
  status: 'clear' | 'watch' | 'warning' | 'block';
  customerName: string;
}

export const WeatherFlightDeck: React.FC = () => {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [events, setEvents] = useState<OutdoorEventRisk[]>([
    {
      bookingId: 'BK-2026-0044',
      eventName: 'Oakridge Elementary Carnival',
      eventDate: '2026-09-26',
      windMph: 28.5,
      precipInch: 0.12,
      status: 'warning',
      customerName: 'Oakridge PTA',
    },
    {
      bookingId: 'BK-2026-0051',
      eventName: 'Austin Craft Beer Festival',
      eventDate: '2026-09-26',
      windMph: 34.0,
      precipInch: 0.45,
      status: 'block',
      customerName: 'Austin Festival LLC',
    },
    {
      bookingId: 'BK-2026-0062',
      eventName: 'Miller Birthday Bash',
      eventDate: '2026-09-27',
      windMph: 14.2,
      precipInch: 0.05,
      status: 'watch',
      customerName: 'Sarah Miller',
    },
  ]);

  const flaggedCount = events.filter((e) => e.status === 'warning' || e.status === 'block').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-5xl mx-auto space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⛈️</span> Weather Risk Flight Deck
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Open-Meteo telemetry monitoring for wind speed, precipitation, and outdoor equipment safety limits.
          </p>
        </div>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📢</span> Broadcast Batch Alert ({flaggedCount})
        </button>
      </div>

      {/* Risk Metrics Banner */}
      <div className="grid grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
          <span className="text-slate-400 font-medium block">Total Outdoor Bookings (72h)</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">18 Events</span>
        </div>
        <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/60">
          <span className="text-amber-400 font-medium block">Weather Watch</span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">4 Events</span>
        </div>
        <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-800/60">
          <span className="text-rose-400 font-medium block">High Wind Warnings (&gt;25mph)</span>
          <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">2 Events</span>
        </div>
        <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60">
          <span className="text-emerald-400 font-medium block">Auto Rain-Date Offers</span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">3 Active Holds</span>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
            <tr>
              <th className="px-4 py-3">Booking ID & Event</th>
              <th className="px-4 py-3">Event Date</th>
              <th className="px-4 py-3">Wind Speed</th>
              <th className="px-4 py-3">Precipitation</th>
              <th className="px-4 py-3">Risk Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {events.map((e) => (
              <tr key={e.bookingId} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-white">{e.eventName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{e.bookingId} • {e.customerName}</div>
                </td>
                <td className="px-4 py-3 font-mono">{e.eventDate}</td>
                <td className="px-4 py-3 font-mono font-semibold">
                  <span className={e.windMph >= 25 ? 'text-rose-400' : 'text-slate-200'}>
                    {e.windMph} mph
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{e.precipInch} in/hr</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      e.status === 'block'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : e.status === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    Offer Rain Date →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBroadcastModal && <BroadcastAlertModal onClose={() => setShowBroadcastModal(false)} affectedCount={flaggedCount} />}
    </div>
  );
};

export default WeatherFlightDeck;
