import React, { useState } from 'react';
import TrustBadgeRow from './TrustBadgeRow';

interface FlightDeckProps {
  bookingId?: string;
  eventName?: string;
  milestone?: 'dispatched' | 'en_route' | 'on_site' | 'setup_ready' | 'live' | 'completed';
  etaMinutes?: number;
}

export const FlightDeck: React.FC<FlightDeckProps> = ({
  bookingId = 'BK-2026-0091',
  eventName = 'Austin Prom Gala 2026',
  milestone = 'en_route',
  etaMinutes = 18,
}) => {
  const milestones = [
    { key: 'dispatched', label: 'Dispatched', icon: '🚚' },
    { key: 'en_route', label: 'En Route', icon: '📍' },
    { key: 'on_site', label: 'On Site Arrival', icon: '⛺' },
    { key: 'setup_ready', label: 'Setup Ready', icon: '⚡' },
    { key: 'live', label: 'Event Live', icon: '🎉' },
    { key: 'completed', label: 'Completed', icon: '🏁' },
  ];

  const currentIdx = milestones.findIndex((m) => m.key === milestone);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h1 className="text-2xl font-bold text-white mt-1.5">{eventName}</h1>
          <p className="text-xs text-slate-400">Live Client Event Day Flight Deck Telemetry</p>
        </div>
        {milestone === 'en_route' && (
          <div className="text-right">
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold animate-pulse">
              ● Live ETA: ~{etaMinutes} min
            </span>
          </div>
        )}
      </div>

      {/* Animated Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {milestones.map((m, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={m.key}
              className={`p-3 rounded-xl border text-center transition-all ${
                isCurrent
                  ? 'bg-emerald-950/70 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50'
                  : isDone
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600'
              }`}
            >
              <span className="text-xl block mb-1">{m.icon}</span>
              <span className={`text-xs font-bold block ${isCurrent ? 'text-emerald-400' : 'text-slate-300'}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Embedded Trust Badge Row */}
      <TrustBadgeRow />
    </div>
  );
};

export default FlightDeck;
