import React from 'react';
import { Award, Clock, CheckSquare, Shield, Star } from 'lucide-react';

interface ReliabilityScorecardProps {
  score?: number;
  tier?: string;
  punctuality?: number;
  checklistFidelity?: number;
  assetCare?: number;
  csat?: number;
}

export const ReliabilityScorecard: React.FC<ReliabilityScorecardProps> = ({
  score = 98.2,
  tier = 'Platinum',
  punctuality = 99.0,
  checklistFidelity = 97.5,
  assetCare = 100.0,
  csat = 98.0,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">Worker Reliability Scorecard</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {tier} Tier
        </span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400">Composite Reliability Rating</span>
          <p className="text-3xl font-extrabold text-white font-mono mt-0.5">{score.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 100</span></p>
        </div>
        <div className="text-right text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          Top 5% Crew Priority
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Punctuality (40%)</span>
            <span className="font-semibold text-slate-200 font-mono">{punctuality.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Checklist (25%)</span>
            <span className="font-semibold text-slate-200 font-mono">{checklistFidelity.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Asset Care (20%)</span>
            <span className="font-semibold text-slate-200 font-mono">{assetCare.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Client CSAT (15%)</span>
            <span className="font-semibold text-slate-200 font-mono">{csat.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
