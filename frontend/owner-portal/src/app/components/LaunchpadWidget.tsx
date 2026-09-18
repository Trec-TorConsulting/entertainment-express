import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Rocket, Sparkles, ArrowRight, ShieldCheck, X } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string;
  route: string;
  completed: boolean;
  ai_prompt: string;
}

interface OnboardingStatus {
  progress: number;
  completed_count: number;
  total_quests: number;
  is_fully_launched: boolean;
  quests: Quest[];
}

export const LaunchpadWidget: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem("ee_owner_launchpad_dismissed") === "true";
  });

  useEffect(() => {
    fetch("/api/method/entertainment_express.api.portal_owner.get_onboarding_status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.message) {
          setStatus(data.message);
        }
      })
      .catch((err) => console.error("Failed to load onboarding status", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("ee_owner_launchpad_dismissed", "true");
  };

  const handleRestore = () => {
    setDismissed(false);
    localStorage.removeItem("ee_owner_launchpad_dismissed");
  };

  if (loading) return null;
  if (!status || status.is_fully_launched) return null;

  if (dismissed) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 transition-all shadow-sm"
          title="Re-open Setup Launchpad"
        >
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          <span>Show Setup Launchpad ({status.completed_count}/{status.total_quests})</span>
        </button>
      </div>
    );
  }

  const handleAskAI = (prompt: string) => {
    navigate(`/assistant?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl text-white mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/40 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-500/40">
            <Rocket className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              Launchpad: Setup Your Business
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300">
                {status.completed_count} of {status.total_quests} Completed
              </span>
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              Complete these 5 quick quests to launch your business with Enterprise power.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-purple-300">{status.progress}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Launch Progress</div>
          </div>
          <div className="w-32 bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-900/60 text-slate-400 hover:text-white transition-colors border border-slate-700/60 ml-2"
            title="Dismiss Launchpad Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {status.quests.map((quest) => (
          <div
            key={quest.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              quest.completed
                ? "bg-slate-900/60 border-emerald-500/30 text-slate-300"
                : "bg-slate-800/60 border-purple-500/30 hover:border-purple-400 text-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Quest</span>
                {quest.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-purple-400/50" />
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">{quest.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{quest.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => navigate(quest.route)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  quest.completed
                    ? "bg-slate-800 text-emerald-300 border border-emerald-500/20 hover:bg-slate-700"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/40"
                }`}
              >
                {quest.completed ? "Review Setup" : "Start Quest"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleAskAI(quest.ai_prompt)}
                className="w-full py-1 px-2 text-[11px] font-medium text-purple-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                Ask AI for Examples
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
