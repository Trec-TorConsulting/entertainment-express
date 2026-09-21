import React from 'react';

interface TrustBadgeRowProps {
  policyLimit?: string;
  carrierName?: string;
  backgroundCheckVerified?: boolean;
}

export const TrustBadgeRow: React.FC<TrustBadgeRowProps> = ({
  policyLimit = '$2,000,000 Commercial Liability',
  carrierName = 'Travelers Insurance Group',
  backgroundCheckVerified = true,
}) => {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-200 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span>🛡️</span> Verified Operator Trust Vault
        </span>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
          100% Insured & Vetted
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-sm">✓</span>
          <div>
            <span className="text-slate-400 block font-medium">COI Insurance Limit</span>
            <span className="text-slate-100 font-semibold">{policyLimit}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-sm">✓</span>
          <div>
            <span className="text-slate-400 block font-medium">Field Crew Background</span>
            <span className="text-slate-100 font-semibold">100% 7-Year Checked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBadgeRow;
