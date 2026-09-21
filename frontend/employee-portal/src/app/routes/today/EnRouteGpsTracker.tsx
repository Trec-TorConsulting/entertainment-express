import React, { useState } from 'react';

interface EnRouteGpsTrackerProps {
  bookingId?: string;
  onMilestoneChange?: (milestone: string) => void;
}

export const EnRouteGpsTracker: React.FC<EnRouteGpsTrackerProps> = ({
  bookingId = 'BK-2026-0091',
  onMilestoneChange,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState('en_route');

  const handleToggleStreaming = () => {
    const nextState = !isStreaming;
    setIsStreaming(nextState);
  };

  const handleAdvanceMilestone = (nextM: string) => {
    setCurrentMilestone(nextM);
    if (onMilestoneChange) onMilestoneChange(nextM);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 max-w-md mx-auto space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-base font-bold text-white mt-1">Crew GPS Telemetry Streamer</h2>
        </div>
        <button
          onClick={handleToggleStreaming}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            isStreaming
              ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {isStreaming ? '● GPS Streaming ON' : '○ Start En-Route GPS'}
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <span className="text-slate-400 font-medium block uppercase tracking-wider">Quick Milestone Transition</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAdvanceMilestone('en_route')}
            className={`py-2 px-2 rounded font-semibold border ${
              currentMilestone === 'en_route'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            📍 En Route
          </button>
          <button
            onClick={() => handleAdvanceMilestone('on_site')}
            className={`py-2 px-2 rounded font-semibold border ${
              currentMilestone === 'on_site'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            ⛺ On Site (Scrub GPS)
          </button>
          <button
            onClick={() => handleAdvanceMilestone('setup_ready')}
            className={`py-2 px-2 rounded font-semibold border ${
              currentMilestone === 'setup_ready'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            ⚡ Setup Ready
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnRouteGpsTracker;
