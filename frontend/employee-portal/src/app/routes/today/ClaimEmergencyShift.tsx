import React, { useState } from 'react';

interface ClaimEmergencyShiftProps {
  token?: string;
  eventName?: string;
  bonusAmount?: number;
}

export const ClaimEmergencyShift: React.FC<ClaimEmergencyShiftProps> = ({
  token = 'demo-claim-token',
  eventName = 'Austin Prom Gala 2026',
  bonusAmount = 100,
}) => {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setUnlocked(true);
      setClaimed(true);
    }, 800);
  };

  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center">
        <div className="bg-amber-950/60 border border-amber-800 rounded-2xl p-4 inline-block">
          <span className="text-3xl block">🚨</span>
          <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold mt-1 block">
            Emergency Shift Callout
          </span>
        </div>

        <div>
          <h1 className="text-xl font-black text-white">{eventName}</h1>
          <p className="text-xs text-slate-400 mt-1">Lead DJ Replacement Needed • Immediate Start</p>
        </div>

        {/* Surge Bonus Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-1">
          <span className="text-xs uppercase font-semibold text-slate-400 block">Instant Surge Bonus</span>
          <span className="text-3xl font-mono font-extrabold text-emerald-400">+${bonusAmount}.00</span>
          <p className="text-[10px] text-slate-400">Added to standard per-event base rate</p>
        </div>

        {claimed ? (
          <div className="bg-emerald-950/80 border border-emerald-800 rounded-2xl p-6 space-y-2">
            <span className="text-4xl block">🎉</span>
            <h2 className="text-lg font-bold text-emerald-300">Shift Claimed & Locked!</h2>
            <p className="text-xs text-slate-200 leading-relaxed">
              You won the shift! Your dispatch run sheet has been updated with venue address and customer notes.
            </p>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl text-base shadow-xl transition-all transform active:scale-95"
          >
            {claiming ? '⚡ Claiming Shift...' : '⚡ CLAIM SHIFT NOW ($100 BONUS)'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClaimEmergencyShift;
