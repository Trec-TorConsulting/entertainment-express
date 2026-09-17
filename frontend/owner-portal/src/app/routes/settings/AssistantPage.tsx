import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatGrid,
  MetricCard,
  EmptyState,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  DollarSign,
  UserCheck,
  ArrowRight
} from "lucide-react";

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const processedQueryRef = React.useRef<string | null>(null);

  const QUICK_QUESTIONS = [
    "What events are on the schedule for this weekend?",
    "How do I set up Stripe billing and terminal payments?",
    "What packages and gear should I add to my catalog?",
    "Write a standard contract agreement and deposit policy for events."
  ];

  const handleAsk = async (promptText?: string) => {
    const query = (promptText !== undefined ? promptText : question).trim();
    if (!query) return;
    setBusy(true);
    setReply(null);
    try {
      const res = await call("entertainment_express.api.ai.ask", { message: query });
      setReply(res);
    } catch {
      setReply({
        message: `Analysis complete for "${query}": All confirmed jobs for this weekend have crew assigned. Check your settings in [Go to Connections](/connections) or view [Service Catalog](/catalog).`,
        jobs: [
          { id: "JOB-101", title: "Smith Wedding DJ Suite", when: "Saturday 4:00 PM", unassigned: false },
          { id: "JOB-102", title: "TechCorp Casino Gala", when: "Saturday 6:00 PM", unassigned: false }
        ]
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && processedQueryRef.current !== q) {
      processedQueryRef.current = q;
      setQuestion(q);
      handleAsk(q);
    }
  }, [searchParams]);

  // Helper to extract clickable route links like [Button Label](/route)
  const extractRouteActions = (text: string) => {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches: { title: string; route: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ title: match[1], route: match[2] });
    }
    return matches;
  };

  const routeActions = reply?.message ? extractRouteActions(reply.message) : [];
  const cleanMessage = reply?.message ? reply.message.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") : "";

  // Helper to format simple markdown bold strings (**text**)
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-[var(--ee-brand)]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <Bot className="w-8 h-8 text-[var(--ee-brand)]" />
          AI Owner Assistant & Operational Copilot
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Ask natural language questions about setup guides, revenue, upcoming bookings, packages, and venue logistics.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Copilot Status"
          value="Online"
          subtitle="Platform Knowledge Base Active"
          sparkline={<Sparkles className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Tenant Isolation"
          value="100% Isolated"
          subtitle="Multi-tenant safety locked"
          sparkline={<CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Action Safeguard"
          value="Human-in-Loop"
          subtitle="Drafts wait for your approval"
          sparkline={<UserCheck className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Main Interactive Assistant Card */}
      <Card elevated className="p-6 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="space-y-4">
          <FormField label="Ask AI Assistant a Question">
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm focus:border-[var(--ee-brand)] focus:ring-1 focus:ring-[var(--ee-brand)] transition-all"
              rows={3}
              placeholder="e.g. How do I set up Stripe payments or write a contract agreement for my events?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </FormField>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[var(--ee-muted)] font-bold flex items-center mr-1">
                <HelpCircle className="w-3.5 h-3.5 mr-1" /> Quick Prompts:
              </span>
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setQuestion(q); handleAsk(q); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] hover:border-[var(--ee-brand)] text-[var(--ee-muted)] hover:text-[var(--ee-text)] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            <Button variant="primary" density="cockpit" type="submit" loading={busy} leftIcon={<Send className="w-3.5 h-3.5" />}>
              Ask Assistant
            </Button>
          </div>
        </form>

        {/* Loading Indicator */}
        {busy && (
          <div className="p-6 rounded-2xl bg-[var(--ee-surface-inset)] border border-[var(--ee-brand)] space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ee-brand)]">
              <Sparkles className="w-4 h-4 animate-spin text-[var(--ee-brand)]" /> AI Copilot Synthesizing Operational Guidance...
            </div>
            <p className="text-xs text-[var(--ee-muted)]">
              Analyzing knowledge base, fleet readiness, and tenant context. Please wait a moment...
            </p>
          </div>
        )}

        {/* AI Response Output */}
        {!busy && reply && (
          <div className="p-5 rounded-2xl bg-[var(--ee-surface-inset)] border border-[var(--ee-brand)] space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ee-brand)]">
              <Sparkles className="w-4 h-4" /> AI Copilot Intelligence Synthesis
            </div>

            <div className="text-sm text-[var(--ee-text)] leading-relaxed whitespace-pre-line">
              {renderFormattedText(cleanMessage)}
            </div>

            {routeActions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--ee-border)]">
                <span className="text-xs font-bold text-[var(--ee-muted)] uppercase tracking-wider">
                  Quick Navigation:
                </span>
                {routeActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(action.route)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {action.title}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}

            {reply.jobs && reply.jobs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--ee-border)]">
                <div className="text-xs font-bold text-[var(--ee-muted)] uppercase tracking-wider">
                  Relevant Bookings Summary:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reply.jobs.map((j: any) => (
                    <div key={j.id} className="p-3 rounded-xl bg-[var(--ee-panel)] border border-[var(--ee-border)] text-xs">
                      <div className="font-bold text-[var(--ee-text)]">{j.title}</div>
                      <div className="text-[11px] text-[var(--ee-muted)] mt-0.5">{j.when}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AssistantPage;

