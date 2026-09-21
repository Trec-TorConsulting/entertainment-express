import React, { useState } from 'react';

interface WeatherGuaranteeProps {
  bookingId?: string;
  eventName?: string;
  eventDate?: string;
  rainOfferAvailable?: boolean;
}

export const WeatherGuarantee: React.FC<WeatherGuaranteeProps> = ({
  bookingId = 'BK-2026-0044',
  eventName = 'Oakridge Elementary Carnival',
  eventDate = '2026-09-26',
  rainOfferAvailable = true,
}) => {
  const [claimed, setClaimed] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const handleClaimVoucher = () => {
    const code = `RAIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setVoucherCode(code);
    setClaimed(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-xl mx-auto space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-xl font-bold text-white mt-1.5">{eventName}</h2>
          <p className="text-xs text-slate-400">Scheduled Date: {eventDate}</p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-3 py-1 rounded-full font-semibold">
            ⛈️ Weather Watch Active
          </span>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs space-y-2">
        <h3 className="font-bold text-slate-200 text-sm">Entertainment Express Weather Policy Guarantee</h3>
        <p className="text-slate-400 leading-relaxed">
          High wind gusts (&gt;25 mph) or heavy rain forecast within 48 hours of your outdoor event qualify for our 100% Zero-Loss Rain Date Guarantee.
        </p>
      </div>

      {claimed ? (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-5 text-center space-y-2">
          <span className="text-3xl block">🎉</span>
          <h3 className="text-base font-bold text-emerald-300">Rain Date Voucher Issued!</h3>
          <p className="text-xs text-slate-300">Your deposit and payments have been converted to full rebooking store credit.</p>
          <div className="bg-slate-900 border border-emerald-700 rounded-lg p-3 inline-block font-mono text-lg font-bold text-emerald-400 mt-2">
            {voucherCode}
          </div>
          <p className="text-[10px] text-slate-400">Valid for 365 days on any future booking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 text-xs">
            <span className="font-bold text-amber-400 block mb-1">Available Rain Date Options:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Reschedule to <strong>Saturday, October 3, 2026</strong> (Equipment & Crew Reserved)</li>
              <li>Reschedule to <strong>Sunday, October 4, 2026</strong> (Equipment & Crew Reserved)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => alert('Rain date confirmed for Oct 3!')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors"
            >
              ✓ Accept Oct 3 Rain Date
            </button>
            <button
              onClick={handleClaimVoucher}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-lg text-xs border border-slate-700 transition-colors"
            >
              🎟️ Convert to Store Credit Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherGuarantee;
