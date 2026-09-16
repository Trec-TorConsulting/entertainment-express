import React from 'react';

export interface ProjectedCogs {
  labor: number;
  subcontractor: number;
  consumables: number;
  equipment_wear: number;
  transit: number;
  gateway_fees: number;
  total: number;
}

export interface MarginSimulationMeterProps {
  grossRevenue: number;
  projectedCogs: ProjectedCogs;
  projectedNetProfit: number;
  projectedMarginPercent: number;
  targetMarginPercent?: number;
  minimumMarginFloorPercent?: number;
  isBelowFloor: boolean;
  overrideRequired: boolean;
  status: 'healthy' | 'warning' | 'below_floor' | string;
  recommendedPrice: number;
  onApplyRecommendedPrice?: (price: number) => void;
  onOverrideFloor?: () => void;
}

export const MarginSimulationMeter: React.FC<MarginSimulationMeterProps> = ({
  grossRevenue,
  projectedCogs,
  projectedNetProfit,
  projectedMarginPercent,
  targetMarginPercent = 40.0,
  minimumMarginFloorPercent = 35.0,
  isBelowFloor,
  overrideRequired,
  status,
  recommendedPrice,
  onApplyRecommendedPrice,
  onOverrideFloor,
}) => {
  const getStatusBadge = () => {
    if (status === 'below_floor' || isBelowFloor) {
      return {
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: 'CRITICAL / BELOW FLOOR',
      };
    }
    if (status === 'warning') {
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: 'MARGIN WARNING',
      };
    }
    return {
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      label: 'HEALTHY MARGIN',
    };
  };

  const badge = getStatusBadge();
  const meterWidth = Math.min(Math.max(projectedMarginPercent, 0), 100);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl text-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-400">
            Pre-Quote Margin Simulator
          </h4>
          <div className="text-2xl font-bold mt-1">
            {projectedMarginPercent.toFixed(1)}%{' '}
            <span className="text-xs font-normal text-slate-400">
              (Net Profit: ${projectedNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.bg}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1">
        <div className="relative h-3 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isBelowFloor
                ? 'bg-rose-500'
                : status === 'warning'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${meterWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-2xs text-slate-400 pt-1">
          <span>Floor: {minimumMarginFloorPercent}%</span>
          <span>Target: {targetMarginPercent}%</span>
        </div>
      </div>

      {/* Floor Violation Alert & Price Helper */}
      {isBelowFloor && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-medium text-rose-300">
            <svg
              className="w-4 h-4 text-rose-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Quote margin ({projectedMarginPercent.toFixed(1)}%) is below floor ({minimumMarginFloorPercent}%). Explicit owner override or price adjustment required.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onApplyRecommendedPrice && recommendedPrice > grossRevenue && (
              <button
                type="button"
                onClick={() => onApplyRecommendedPrice(recommendedPrice)}
                className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition"
              >
                Apply Floor Price (${recommendedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </button>
            )}
            {onOverrideFloor && overrideRequired && (
              <button
                type="button"
                onClick={onOverrideFloor}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-600 transition"
              >
                Owner Override
              </button>
            )}
          </div>
        </div>
      )}

      {/* COGS Breakdown Accordion / List */}
      <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5 text-slate-300">
        <div className="font-semibold text-slate-400 uppercase tracking-wider text-2xs mb-2">
          Projected Direct COGS (${projectedCogs.total.toLocaleString('en-US', { minimumFractionDigits: 2 })})
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Crew Wages:</span>
            <span className="font-mono">${projectedCogs.labor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vehicle Mileage:</span>
            <span className="font-mono">${projectedCogs.transit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Subcontractors:</span>
            <span className="font-mono">${projectedCogs.subcontractor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Equipment Wear:</span>
            <span className="font-mono">${projectedCogs.equipment_wear.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Consumable Stock:</span>
            <span className="font-mono">${projectedCogs.consumables.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Gateway Fees:</span>
            <span className="font-mono">${projectedCogs.gateway_fees.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginSimulationMeter;
