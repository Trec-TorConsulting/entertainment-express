import React from 'react';

interface BoothQrScreenProps {
  galleryUrl?: string;
  eventName?: string;
  pinCode?: string;
}

export const BoothQrScreen: React.FC<BoothQrScreenProps> = ({
  galleryUrl = 'https://entx.app/g/prom-gala-2026',
  eventName = 'Austin High Prom Gala 2026',
  pinCode = '4829',
}) => {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
            Live Photo Booth Gallery
          </span>
          <h1 className="text-2xl font-black text-white mt-3">{eventName}</h1>
          <p className="text-xs text-slate-400 mt-1">Scan QR code with your phone camera to view & download your photos instantly!</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-inner border border-slate-200">
          <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" fill="currentColor">
            {/* Mock stylized QR code path */}
            <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 40h20v20H50zM10 40h20v20H10zM70 70h20v10H70zM80 90h20v10H80zM40 80h10v20H40z" />
          </svg>
        </div>

        {/* PIN Info */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gallery Access PIN</span>
          <span className="text-2xl font-mono font-extrabold text-amber-400 tracking-widest">{pinCode}</span>
        </div>

        <p className="text-[10px] text-slate-500 font-mono">Powered by Entertainment Express Photo Booth OS</p>
      </div>
    </div>
  );
};

export default BoothQrScreen;
