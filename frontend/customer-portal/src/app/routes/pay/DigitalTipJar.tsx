import React, { useState } from 'react';

interface DigitalTipJarProps {
  token?: string;
  eventName?: string;
  crewNames?: string[];
}

export const DigitalTipJar: React.FC<DigitalTipJarProps> = ({
  token = 'demo-tip-token',
  eventName = 'Austin Prom Gala 2026',
  crewNames = ['DJ Marcus Vance', 'Tech Elena Rostova'],
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paid, setPaid] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handlePayTip = () => {
    setPaid(true);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-3xl block">💖</span>
          <h1 className="text-xl font-bold text-white mt-1">{eventName}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Crew Digital Tip Jar</p>
        </div>

        {paid ? (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-6 space-y-2">
            <span className="text-4xl block">✨</span>
            <h2 className="text-lg font-bold text-emerald-300">Thank You!</h2>
            <p className="text-xs text-slate-200">
              Your ${finalAmount.toFixed(2)} tip has been distributed directly to your event crew!
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-slate-300">
              <span className="font-semibold block mb-1">Crew On Shift:</span>
              <span>{crewNames.join(' • ')}</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-2">Select Tip Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                type="number"
                placeholder="Or enter custom amount ($)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Apple Pay Button */}
            <button
              onClick={handlePayTip}
              className="w-full bg-white hover:bg-slate-100 text-black font-extrabold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all"
            >
              <span>Pay</span>
              <span>• Pay ${finalAmount.toFixed(2)} Tip</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTipJar;
