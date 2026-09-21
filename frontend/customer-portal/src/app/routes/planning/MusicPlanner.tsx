import React, { useState } from 'react';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  category: 'must_play' | 'do_not_play' | 'special_moment';
  moment?: string;
  previewUrl?: string;
}

export const MusicPlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'must_play' | 'do_not_play' | 'special_moment'>('must_play');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<TrackItem[]>([
    { id: '1', title: 'Uptown Funk', artist: 'Bruno Mars', category: 'must_play' },
    { id: '2', title: 'Chicken Dance', artist: 'Various', category: 'do_not_play' },
    { id: '3', title: 'At Last', artist: 'Etta James', category: 'special_moment', moment: 'First Dance' },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newMoment, setNewMoment] = useState('');

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const item: TrackItem = {
      id: `t-${Date.now()}`,
      title: newTitle,
      artist: newArtist,
      category: activeTab,
      moment: activeTab === 'special_moment' ? newMoment : undefined,
    };
    setTracks([...tracks, item]);
    setNewTitle('');
    setNewArtist('');
    setNewMoment('');
  };

  const currentTracks = tracks.filter((t) => t.category === activeTab);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-4xl mx-auto space-y-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🎵</span> Event Music & Special Moments Planner
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Build your Must-Play list, specify Do-Not-Play songs, and curate formal moments for your DJ.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('must_play')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'must_play'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🔥 Must-Play Songs ({tracks.filter((t) => t.category === 'must_play').length})
        </button>
        <button
          onClick={() => setActiveTab('do_not_play')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'do_not_play'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🚫 Do-Not-Play List ({tracks.filter((t) => t.category === 'do_not_play').length})
        </button>
        <button
          onClick={() => setActiveTab('special_moment')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'special_moment'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          ✨ Formal Moments ({tracks.filter((t) => t.category === 'special_moment').length})
        </button>
      </div>

      {/* Add Track Form */}
      <form onSubmit={handleAddTrack} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Song Title</label>
            <input
              type="text"
              placeholder="e.g. September"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Artist</label>
            <input
              type="text"
              placeholder="e.g. Earth, Wind & Fire"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          {activeTab === 'special_moment' && (
            <div>
              <label className="block text-slate-400 font-medium mb-1">Formal Moment</label>
              <input
                type="text"
                placeholder="e.g. First Dance, Grand Entrance"
                value={newMoment}
                onChange={(e) => setNewMoment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-4 rounded transition-colors"
        >
          + Add Song to {activeTab.replace('_', ' ').toUpperCase()}
        </button>
      </form>

      {/* Track List */}
      <div className="space-y-2">
        {currentTracks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No songs added to this list yet.</div>
        ) : (
          currentTracks.map((t) => (
            <div
              key={t.id}
              className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white block">{t.title}</span>
                <span className="text-slate-400">{t.artist || 'Unknown Artist'}</span>
                {t.moment && (
                  <span className="ml-2 bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-mono">
                    {t.moment}
                  </span>
                )}
              </div>
              <button
                onClick={() => setTracks(tracks.filter((x) => x.id !== t.id))}
                className="text-slate-500 hover:text-rose-400 font-bold px-2"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MusicPlanner;
