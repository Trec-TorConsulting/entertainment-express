import React from 'react';

interface EventPlDrawerProps {
  onClose: () => void;
  bookingId?: string;
  eventName?: string;
  grossRevenue?: number;
  laborCost?: number;
  subcontractorCost?: number;
  consumableCost?: number;
  equipmentWearCost?: number;
  gatewayFees?: number;
}

export const EventPlDrawer: React.FC<EventPlDrawerProps> = ({
  onClose,
  bookingId = 'BK-2026-0091',
  eventName = 'Austin Prom Gala 2026',
  grossRevenue = 3500,
  laborCost = 850,
  subcontractorCost = 400,
  consumableCost = 120,
  equipmentWearCost = 150,
  gatewayFees = 101.80,
}) => {
  const totalCogs = laborCost + subcontractorCost + consumableCost + equipmentWearCost + gatewayFees;
  const netProfit = grossRevenue - totalCogs;
  const marginPct = Math.round((netProfit / grossRevenue) * 100);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 text-slate-100 shadow-2xl z-50 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-lg font-bold text-white mt-1">{eventName}</h2>
          <p className="text-xs text-slate-400">Event P&L & COGS Waterfall Breakdown</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Margin Gauge */}
      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Net Profit Margin</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">${netProfit.toLocaleString()} ({marginPct}%)</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
          marginPct >= 40 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
        }`}>
          {marginPct >= 40 ? 'Healthy Margin' : 'Warning: Below 40% Floor'}
        </span>
      </div>

      {/* Waterfall Breakdown */}
      <div className="space-y-3 text-xs">
        <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Cost of Goods Sold (COGS)</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>gross Revenue</span>
            <span className="font-mono font-bold text-emerald-400">+${grossRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>Direct Labor & Crew Wages</span>
            <span className="font-mono text-rose-400">-${laborCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>Subcontractor & Partner Fees</span>
            <span className="font-mono text-rose-400">-${subcontractorCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>Event Consumables & Supplies</span>
            <span className="font-mono text-rose-400">-${consumableCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>Asset Depreciation & Wear</span>
            <span className="font-mono text-rose-400">-${equipmentWearCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-700/40">
            <span>Stripe Payment Processing</span>
            <span className="font-mono text-rose-400">-${gatewayFees.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPlDrawer;
