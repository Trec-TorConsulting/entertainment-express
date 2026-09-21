import React, { useState } from 'react';

interface EmergencyDrawerProps {
  onClose: () => void;
  bookingId?: string;
}

export const EmergencyDrawer: React.FC<EmergencyDrawerProps> = ({ onClose, bookingId = 'BK-2026-0091' }) => {
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [bonus, setBonus] = useState(100);

  const handleLaunchBroadcast = () => {
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcasting(false);
      setBroadcastDone(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 text-slate-100 shadow-2xl z-50 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded font-bold">
            🚨 EMERGENCY DISPATCH
          </span>
          <h2 className="text-lg font-bold text-white mt-1">Crew Callout Copilot</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs space-y-2">
        <span className="text-slate-400 block font-medium">Target Event Booking</span>
        <span className="text-sm font-bold text-white font-mono">{bookingId}</span>
        <p className="text-slate-400">Lead DJ called out 2 hours before setup. Automated replacement ranking active.</p>
      </div>

      {/* Bonus Slider */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Surge Incentive Bonus (${bonus})
        </label>
        <input
          type="range"
          min={25}
          max={250}
          step={25}
          value={bonus}
          onChange={(e) => setBonus(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>$25</span>
          <span>$100 (Rec)</span>
          <span>$250</span>
        </div>
      </div>

      {/* Broadcast Ticker */}
      {broadcastDone ? (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-4 text-xs space-y-2">
          <span className="text-emerald-400 font-bold block">✓ SMS Cascade Broadcast Active</span>
          <p className="text-slate-300">Notified 5 off-duty Lead DJs. Waiting for first atomic claim response...</p>
        </div>
      ) : (
        <button
          onClick={handleLaunchBroadcast}
          disabled={broadcasting}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-lg"
        >
          {broadcasting ? 'Launching Cascade...' : '🚀 Launch SMS Broadcast Cascade'}
        </button>
      )}
    </div>
  );
};

export default EmergencyDrawer;
