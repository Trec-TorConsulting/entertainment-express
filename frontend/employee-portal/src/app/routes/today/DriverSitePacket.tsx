import React, { useState } from 'react';

interface DriverSitePacketProps {
  bookingId?: string;
  eventName?: string;
  address?: string;
  gateCode?: string;
  surfaceType?: string;
  powerSource?: string;
  parkingNotes?: string;
  warnings?: string[];
}

export const DriverSitePacket: React.FC<DriverSitePacketProps> = ({
  bookingId = 'BK-2026-0091',
  eventName = 'Oakridge High School Graduation Fest',
  address = '1420 Oakridge Blvd, Austin TX 78704',
  gateCode = '#9842',
  surfaceType = 'Asphalt',
  powerSource = 'Dedicated 20A Outlet within 50ft',
  parkingNotes = 'Enter via West Gate on Elm St. Unload at loading bay #2.',
  warnings = ['Asphalt surface setup: Mandate 8x 50lb sandbags', 'Gate width is 38in - tight turn on entrance ramp'],
}) => {
  const [copied, setCopied] = useState(false);

  const copyGateCode = () => {
    navigator.clipboard.writeText(gateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMap = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 max-w-lg mx-auto shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
            {bookingId}
          </span>
          <h2 className="text-lg font-bold text-white mt-1.5">{eventName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{address}</p>
        </div>
        <button
          onClick={openMap}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          📍 Launch Maps
        </button>
      </div>

      {/* Gate Code Card */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 mb-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 block">Access Gate Code</span>
          <span className="text-xl font-mono font-extrabold text-amber-400 tracking-wider">{gateCode}</span>
        </div>
        <button
          onClick={copyGateCode}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded font-medium transition-colors"
        >
          {copied ? '✓ Copied!' : '📋 Copy PIN'}
        </button>
      </div>

      {/* Site Requirements */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="bg-slate-800/40 p-2.5 rounded border border-slate-700/50">
          <span className="text-slate-400 block font-medium">Surface Type</span>
          <span className="text-slate-200 font-semibold">{surfaceType}</span>
        </div>
        <div className="bg-slate-800/40 p-2.5 rounded border border-slate-700/50">
          <span className="text-slate-400 block font-medium">Power Reach</span>
          <span className="text-slate-200 font-semibold truncate block">{powerSource}</span>
        </div>
      </div>

      {/* Driver Parking Notes */}
      <div className="mb-4 bg-slate-800/30 p-3 rounded border border-slate-700/40 text-xs">
        <span className="text-slate-400 block font-semibold uppercase mb-1">Driver Parking & Delivery Path</span>
        <p className="text-slate-300 leading-relaxed">{parkingNotes}</p>
      </div>

      {/* Logistics Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-xs">
          <span className="text-amber-400 font-bold block mb-1">⚠️ Logistics & Fit Alerts</span>
          <ul className="list-disc list-inside space-y-1 text-amber-200/90">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DriverSitePacket;
