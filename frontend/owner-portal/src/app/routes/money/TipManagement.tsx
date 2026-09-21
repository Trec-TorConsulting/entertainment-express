import React, { useState } from 'react';

interface TipPoolRecord {
  bookingId: string;
  eventName: string;
  totalTipPool: number;
  policy: 'equal' | 'hours_weighted' | 'lead_weighted';
  status: 'accruing' | 'settled' | 'locked';
}

export const TipManagement: React.FC = () => {
  const [pools, setPools] = useState<TipPoolRecord[]>([
    {
      bookingId: 'BK-2026-0044',
      eventName: 'Oakridge Elementary Carnival',
      totalTipPool: 120.0,
      policy: 'equal',
      status: 'accruing',
    },
    {
      bookingId: 'BK-2026-0051',
      eventName: 'Austin Craft Beer Festival',
      totalTipPool: 240.0,
      policy: 'hours_weighted',
      status: 'settled',
    },
  ]);

  const handlePolicyChange = (bId: string, newPolicy: any) => {
    setPools(pools.map((p) => (p.bookingId === bId ? { ...p, policy: newPolicy } : p)));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💸</span> Digital Tip Pool Oversight & Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated tip distribution algorithms and monitor crew payouts across bookings.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {pools.map((p) => (
          <div
            key={p.bookingId}
            className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-white text-sm">{p.eventName}</span>
              <div className="text-slate-400 font-mono mt-0.5">{p.bookingId}</div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Tip Pool</span>
                <span className="font-mono font-bold text-emerald-400 text-base">${p.totalTipPool.toFixed(2)}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Split Policy</span>
                <select
                  value={p.policy}
                  onChange={(e) => handlePolicyChange(p.bookingId, e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                >
                  <option value="equal">Equal Division</option>
                  <option value="hours_weighted">Hours-Weighted</option>
                  <option value="lead_weighted">Lead-Weighted (1.5x)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TipManagement;
