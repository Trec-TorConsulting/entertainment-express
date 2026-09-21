import React, { useState } from 'react';

interface EarningsViewProps {
  workerName?: string;
  availableBalance?: number;
  tipsEarned?: number;
}

export const EarningsView: React.FC<EarningsViewProps> = ({
  workerName = 'Marcus Vance',
  availableBalance = 340.50,
  tipsEarned = 115.00,
}) => {
  const [balance, setBalance] = useState(availableBalance);
  const [cashingOut, setCashingOut] = useState(false);

  const handleInstantCashout = () => {
    setCashingOut(true);
    setTimeout(() => {
      setCashingOut(false);
      setBalance(0);
      alert(`Instant Cashout of $${balance.toFixed(2)} transferred to your debit card via Stripe Instant Payout!`);
    }, 1200);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-lg mx-auto space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
            Stripe Connect Express
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{workerName} Earnings</h2>
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold">
          ● Instant Payout Ready
        </span>
      </div>

      {/* Available Balance Box */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-center space-y-2">
        <span className="text-xs uppercase font-semibold text-slate-400 block">Available for Instant Cashout</span>
        <span className="text-4xl font-mono font-extrabold text-emerald-400">${balance.toFixed(2)}</span>
        <p className="text-[10px] text-slate-400">Includes ${tipsEarned.toFixed(2)} in guest tips from recent events</p>
      </div>

      <button
        disabled={balance <= 0 || cashingOut}
        onClick={handleInstantCashout}
        className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold transition-all ${
          balance > 0
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        {cashingOut ? '💸 Transferring to Debit Card...' : '⚡ 1-Tap Instant Cashout to Debit Card'}
      </button>
    </div>
  );
};

export default EarningsView;
