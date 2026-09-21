import React, { useState } from 'react';

interface LiveRequest {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  tipAmount: number;
  isDnpConflict: boolean;
  status: 'pending' | 'played' | 'rejected';
}

export const LiveDjScreen: React.FC = () => {
  const [requests, setRequests] = useState<LiveRequest[]>([
    {
      id: 'req-1',
      title: 'Levitating',
      artist: 'Dua Lipa',
      requestedBy: 'Sarah (Table 4)',
      tipAmount: 5,
      isDnpConflict: false,
      status: 'pending',
    },
    {
      id: 'req-2',
      title: 'Macarena',
      artist: 'Los Del Rio',
      requestedBy: 'Guest',
      tipAmount: 0,
      isDnpConflict: true,
      status: 'pending',
    },
  ]);

  const handleMarkPlayed = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'played' } : r)));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded uppercase">
            Live Booth Cockpit
          </span>
          <h1 className="text-2xl font-black text-white mt-1">VirtualDJ & Live Requests Feed</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full font-mono">
            {pending.length} Requests Queued
          </span>
        </div>
      </div>

      {/* Main Feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Pending Feed Column */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Live Incoming Requests</h2>

          {pending.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              No pending requests. Ask guests to scan the QR code!
            </div>
          ) : (
            pending.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  req.isDnpConflict
                    ? 'bg-rose-950/40 border-rose-800/80'
                    : req.tipAmount > 0
                    ? 'bg-amber-950/30 border-amber-800/60'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{req.title}</span>
                    {req.isDnpConflict && (
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold uppercase">
                        ⚠️ DO-NOT-PLAY CONFLICT
                      </span>
                    )}
                    {req.tipAmount > 0 && (
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                        💰 ${req.tipAmount} TIP BOOST
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{req.artist}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Requested by: {req.requestedBy}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkPlayed(req.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    ✓ Mark Played
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs px-2.5 py-2 rounded-lg border border-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Exporters Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Export DJ Software Playlists</h3>
          <p className="text-[11px] text-slate-400">Export formatted playlist files to load directly into your DJ software decks.</p>

          <div className="space-y-2">
            <button
              onClick={() => alert('Serato CSV Exported!')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 text-left font-mono transition-colors flex justify-between"
            >
              <span>Serato DJ (.csv)</span>
              <span className="text-slate-500">⬇️</span>
            </button>
            <button
              onClick={() => alert('Rekordbox XML Exported!')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 text-left font-mono transition-colors flex justify-between"
            >
              <span>Rekordbox (.xml)</span>
              <span className="text-slate-500">⬇️</span>
            </button>
            <button
              onClick={() => alert('VirtualDJ Folder Exported!')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 text-left font-mono transition-colors flex justify-between"
            >
              <span>VirtualDJ Sideview (.vdjfolder)</span>
              <span className="text-slate-500">⬇️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDjScreen;
