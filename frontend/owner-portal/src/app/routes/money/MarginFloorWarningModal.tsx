import React from 'react';

interface MarginFloorWarningModalProps {
  onClose: () => void;
  onOverride: () => void;
  currentMarginPct?: number;
  floorMarginPct?: number;
  recommendedPrice?: number;
}

export const MarginFloorWarningModal: React.FC<MarginFloorWarningModalProps> = ({
  onClose,
  onOverride,
  currentMarginPct = 28.5,
  floorMarginPct = 35.0,
  recommendedPrice = 1850.0,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
            <span>⚠️</span> Minimum Margin Floor Warning
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The calculated net margin for this quote is <strong className="text-rose-400">{currentMarginPct}%</strong>, which falls below your company's minimum floor policy of <strong className="text-amber-400">{floorMarginPct}%</strong>.
        </p>

        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs space-y-1">
          <span className="text-slate-400 font-medium block">Recommended Adjustment</span>
          <span className="text-emerald-400 font-bold font-mono">Increase price to ${recommendedPrice.toLocaleString()}</span>
          <p className="text-[10px] text-slate-500">Achieves target 35%+ profitability floor.</p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
          >
            Adjust Quote Price
          </button>
          <button
            onClick={onOverride}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded"
          >
            Manager Override & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarginFloorWarningModal;
