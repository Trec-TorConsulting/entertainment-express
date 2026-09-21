import React, { useState } from 'react';

interface ClientMediaDashboardProps {
  bookingId?: string;
  galleryTitle?: string;
}

export const ClientMediaDashboard: React.FC<ClientMediaDashboardProps> = ({
  bookingId = 'BK-2026-0091',
  galleryTitle = 'Oakridge Gala Photo & Video Vault',
}) => {
  const [published, setPublished] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleExportZip = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('ZIP archive compiled successfully! Download started.');
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{galleryTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPublished(!published)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              published
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {published ? '● Guest Share Active' : '○ Private Vault'}
          </button>
          <button
            onClick={handleExportZip}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {downloading ? '⌛ Compiling ZIP...' : '📦 Export Full High-Res ZIP'}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
          <span className="text-slate-400 block font-medium">Total Media Uploads</span>
          <span className="text-lg font-bold text-white font-mono">148 Photos / GIFs</span>
        </div>
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
          <span className="text-slate-400 block font-medium">Print Station Prints</span>
          <span className="text-lg font-bold text-amber-400 font-mono">92 Prints Made</span>
        </div>
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
          <span className="text-slate-400 block font-medium">Guest Share Link</span>
          <span className="text-xs font-mono text-slate-300 truncate block mt-1">/g/prom-gala-2026</span>
        </div>
      </div>

      {/* Moderation Grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Moderation & Guest Curated Reel</h3>
        <p className="text-xs text-slate-400 mb-4">Toggle photos visibility on the public guest gallery share link.</p>

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 aspect-square group">
              <img
                src={`https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300`}
                alt={`Photo ${n}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded">
                <input type="checkbox" defaultChecked className="accent-emerald-500 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientMediaDashboard;
