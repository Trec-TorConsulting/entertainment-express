import React, { useState } from 'react';
import { Sparkles, Sun, Clock, Check, X, ShieldAlert, Zap } from 'lucide-react';

interface CopilotTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
}

export const CopilotTimelineDrawer: React.FC<CopilotTimelineDrawerProps> = ({
  isOpen,
  onClose,
  bookingId = 'EB-2026-009',
}) => {
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<any[] | null>(null);
  const [solarInfo, setSolarInfo] = useState<any | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        '/api/method/entertainment_express.copilot.timeline_synthesizer.generate_run_of_show',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId }),
        }
      );
      const data = await res.json();
      const msg = data.message || {};
      setTimeline(msg.moments || []);
      setSolarInfo(msg.solar || null);
    } catch {
      // Mock fallback if offline/dev server
      setSolarInfo({ sunset: '19:14', golden_hour_start: '18:29' });
      setTimeline([
        {
          activity_name: 'Crew Load-In & Audio Sound Check',
          start_time: '14:30',
          end_time: '15:45',
          speaker: 'Production Crew',
          description: 'Unload gear, set up main PA systems, and perform wireless mic sweep.',
        },
        {
          activity_name: 'Guest Arrival & Cocktail Hour',
          start_time: '16:00',
          end_time: '17:00',
          speaker: 'Background Music',
          description: 'Smooth upbeat jazz playlist.',
        },
        {
          activity_name: 'Golden Hour Outdoor Photo Window',
          start_time: '18:29',
          end_time: '19:14',
          speaker: 'Photographer / Couple',
          description: 'Sun-anchored golden hour session.',
        },
        {
          activity_name: 'Open Dance Floor Peak Sets',
          start_time: '19:15',
          end_time: '22:30',
          speaker: 'Lead DJ',
          description: 'High-energy dance rotation.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#12161f] border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-base">Copilot Run-of-Show Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Callout */}
        <div className="p-4 bg-indigo-500/10 border-b border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300">
              Booking: {bookingId}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              Ollama Agentic Synthesis
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Synthesize minute-by-minute timeline moments incorporating questionnaire responses, astronomical sunset calculation, and venue noise curfews.
          </p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow"
          >
            <Zap className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synthesizing Timeline...' : 'Generate AI Run-of-Show'}
          </button>
        </div>

        {/* Solar Constraints Banner */}
        {solarInfo && (
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Calculated Sunset: <strong>{solarInfo.sunset}</strong></span>
            </div>
            <span className="text-slate-400">Golden Hour: {solarInfo.golden_hour_start}</span>
          </div>
        )}

        {/* Timeline Moments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {timeline ? (
            timeline.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 flex flex-col space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-indigo-300 font-semibold">
                  <span>{item.start_time} - {item.end_time}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.speaker}</span>
                </div>
                <div className="font-semibold text-slate-200 text-sm">{item.activity_name}</div>
                <p className="text-slate-400 text-xs">{item.description}</p>
              </div>
            ))
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-indigo-400/50" />
              <p className="text-sm font-medium text-slate-300">No AI timeline generated yet.</p>
              <p className="text-xs text-slate-400">Click "Generate AI Run-of-Show" above to compute solar-anchored moments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
