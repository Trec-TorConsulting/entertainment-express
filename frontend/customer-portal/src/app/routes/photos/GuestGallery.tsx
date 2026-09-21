import React, { useState } from 'react';
import LightboxModal, { GalleryItem } from './LightboxModal';

interface GuestGalleryProps {
  token?: string;
  title?: string;
  pinRequired?: boolean;
}

export const GuestGallery: React.FC<GuestGalleryProps> = ({
  token = 'demo-gallery-token',
  title = 'Austin High Prom 2026 Live Gallery',
  pinRequired = false,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(!pinRequired);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const mockItems: GalleryItem[] = [
    { id: '1', title: 'Photo 1', file_name: 'photo_01.jpg', content_b64: '' },
    { id: '2', title: 'Photo 2', file_name: 'photo_02.jpg', content_b64: '' },
    { id: '3', title: 'Photo 3', file_name: 'photo_03.jpg', content_b64: '' },
    { id: '4', title: 'Photo 4', file_name: 'photo_04.jpg', content_b64: '' },
  ];

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() !== '') {
      setUnlocked(true);
    }
  };

  if (!unlocked) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md mx-auto text-center text-slate-100 shadow-2xl">
        <span className="text-3xl mb-3 block">🔒</span>
        <h2 className="text-lg font-bold text-white mb-1">{title}</h2>
        <p className="text-xs text-slate-400 mb-6">Enter access PIN provided by your event host to unlock gallery photos.</p>

        <form onSubmit={handleUnlockPin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter PIN Code"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-emerald-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors"
          >
            Unlock Gallery
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">Zero-app guest photo gallery • Instant high-res downloads</p>
        </div>
        <div className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-semibold">
          ● Live Gallery
        </div>
      </div>

      {/* Masonry Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mockItems.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => setSelectedIndex(idx)}
            className="group relative bg-slate-800 rounded-xl overflow-hidden cursor-pointer border border-slate-700/50 hover:border-emerald-500/50 transition-all aspect-square"
          >
            <img
              src={`https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <span className="text-xs font-medium text-white">{item.title}</span>
              <span className="text-[10px] text-slate-300">Tap to enlarge / download</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <LightboxModal
          item={mockItems[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onNext={() => setSelectedIndex((selectedIndex + 1) % mockItems.length)}
          onPrev={() => setSelectedIndex((selectedIndex - 1 + mockItems.length) % mockItems.length)}
        />
      )}
    </div>
  );
};

export default GuestGallery;
