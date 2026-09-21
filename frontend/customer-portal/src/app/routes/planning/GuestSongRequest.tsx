import React, { useState } from 'react';

interface GuestSongRequestProps {
  token?: string;
  eventName?: string;
}

export const GuestSongRequest: React.FC<GuestSongRequestProps> = ({
  token = 'demo-token',
  eventName = 'Austin High Prom Gala 2026',
}) => {
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [guestName, setGuestName] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center border-b border-slate-800 pb-4">
          <span className="text-2xl">🎧</span>
          <h1 className="text-lg font-bold text-white mt-1">{eventName}</h1>
          <p className="text-xs text-slate-400">Live DJ Request Line & Tip Jar</p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-6 text-center space-y-2">
            <span className="text-3xl block">🎉</span>
            <h2 className="text-base font-bold text-emerald-300">Request Sent to DJ Booth!</h2>
            <p className="text-xs text-slate-300">
              "{songTitle}" by {artist || 'Requested Artist'} has been queued for DJ review.
            </p>
            {tipAmount > 0 && (
              <p className="text-xs text-amber-400 font-semibold mt-2">
                Thank you for your ${tipAmount} DJ tip!
              </p>
            )}
            <button
              onClick={() => {
                setSubmitted(false);
                setSongTitle('');
                setArtist('');
              }}
              className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-4 rounded-lg border border-slate-700"
            >
              Request Another Song
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Song Title</label>
              <input
                type="text"
                placeholder="e.g. Levitating"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Artist Name</label>
              <input
                type="text"
                placeholder="e.g. Dua Lipa"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Your Name / Shoutout</label>
              <input
                type="text"
                placeholder="e.g. Sarah at Table 4"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Tip Option */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Optional DJ Tip / Priority Boost</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 3, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(amt)}
                    className={`py-1.5 rounded font-bold border transition-colors ${
                      tipAmount === amt
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {amt === 0 ? 'No Tip' : `$${amt}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors mt-2"
            >
              Send Request to DJ Booth
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GuestSongRequest;
