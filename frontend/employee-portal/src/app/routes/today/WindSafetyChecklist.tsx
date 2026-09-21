import React, { useState } from 'react';

interface WindSafetyChecklistProps {
  bookingId?: string;
  maxWindMph?: number;
  onComplete?: () => void;
}

export const WindSafetyChecklist: React.FC<WindSafetyChecklistProps> = ({
  bookingId = 'BK-2026-0044',
  maxWindMph = 25,
  onComplete,
}) => {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  const items = [
    { id: 'anemometer', label: `Anemometer wind reading taken (< ${maxWindMph} mph max sustained)` },
    { id: 'sandbag_weight', label: 'Minimum 50-lb sandbag ballast per tether point attached' },
    { id: 'stake_depth', label: 'Commercial 18-inch steel stakes driven flush to turf' },
    { id: 'perimeter_clearance', label: '10-ft overhead and perimeter obstacle clearance verified' },
    { id: 'emergency_power', label: 'Emergency quick-deflate power breaker switch accessible to operator' },
  ];

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allChecked = items.every((i) => checkedItems[i.id]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 max-w-lg mx-auto shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-base font-bold text-white mt-1">Outdoor Wind & Inflatable Safety Protocol</h2>
        </div>
        <span className="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2.5 py-0.5 rounded-full font-bold">
          Max {maxWindMph} MPH
        </span>
      </div>

      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <label
            key={item.id}
            onClick={() => toggleCheck(item.id)}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checkedItems[item.id]
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={!!checkedItems[item.id]}
              onChange={() => {}}
              className="mt-0.5 accent-emerald-500 rounded"
            />
            <span className="text-xs font-medium leading-snug">{item.label}</span>
          </label>
        ))}
      </div>

      <button
        disabled={!allChecked}
        onClick={onComplete}
        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors ${
          allChecked
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        {allChecked ? '✓ Certify Wind Safety & Authorize Setup' : 'Complete All 5 Safety Checks'}
      </button>
    </div>
  );
};

export default WindSafetyChecklist;
