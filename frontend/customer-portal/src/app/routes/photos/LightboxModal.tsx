import React from 'react';

export interface GalleryItem {
  id: string;
  title: string;
  file_name?: string;
  mime?: string;
  content_b64?: string;
}

interface LightboxModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, onClose, onNext, onPrev }) => {
  if (!item) return null;

  const imgSrc = item.content_b64
    ? item.content_b64.startsWith('data:')
      ? item.content_b64
      : `data:${item.mime || 'image/jpeg'};base64,${item.content_b64}`
    : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title || 'Event Media',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Gallery link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white z-10">
        <span className="text-sm font-semibold truncate max-w-xs">{item.title || item.file_name || 'Photo'}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            🔗 Share Photo
          </button>
          <a
            href={imgSrc}
            download={item.file_name || 'photo.jpg'}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            ⬇️ Download
          </a>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl px-2 font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 bg-slate-800/70 hover:bg-slate-700 text-white text-lg w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
          >
            ‹
          </button>
        )}

        <img
          src={imgSrc}
          alt={item.title}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform"
        />

        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-2 bg-slate-800/70 hover:bg-slate-700 text-white text-lg w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
          >
            ›
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400">
        Swipe or use arrows to navigate gallery photos
      </div>
    </div>
  );
};

export default LightboxModal;
