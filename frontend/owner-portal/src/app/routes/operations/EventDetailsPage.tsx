import React, { useState, useEffect } from "react";
import {
  Skeleton,
  EmptyState,
  StatCard,
  StatGrid,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Tabs,
  Dialog,
  call,
  useToast,
} from "@portal-kit";
import {
  FileText,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Smartphone,
  Settings2,
  Zap,
  ListPlus,
  RefreshCw,
  FolderPlus,
  Layers,
} from "lucide-react";

interface QuestionField {
  field_key: string;
  label: string;
  field_type: string;
  options?: string;
  required?: boolean | number;
  conditional_on_field?: string;
  conditional_on_value?: string;
}

interface QuestionnaireTemplate {
  name?: string;
  template_name: string;
  event_type: string;
  purpose: string;
  active: boolean | number;
  reminder_cadence_days: number;
  fields: QuestionField[];
}

interface CueItem {
  title: string;
  offset_minutes: number;
  duration_minutes: number;
  moment_key?: string;
}

interface TimelineTemplate {
  name?: string;
  template_name: string;
  event_type: string;
  active: boolean | number;
  items: CueItem[];
}

const EVENT_TYPES = [
  { id: "wedding", label: "Wedding Experience" },
  { id: "corporate", label: "Corporate & Gala" },
  { id: "birthday", label: "Private Celebration" },
  { id: "school", label: "School / Prom" },
  { id: "inflatable", label: "Inflatable / Carnival" },
  { id: "photo_booth", label: "Photo Booth Activation" },
  { id: "casino", label: "Casino & Game Night" },
  { id: "dj_mc", label: "DJ & Live Talent" },
];

// Common Drop-In Question Presets Library
const COMMON_QUESTION_PRESETS: { category: string; label: string; field_type: string; required: boolean; gate?: string }[] = [
  { category: "Announcements", label: "Phonetic Pronunciations for Entrance Announcements", field_type: "text", required: true },
  { category: "Announcements", label: "Grand Entrance Party Lineup & Pairings", field_type: "textarea", required: false },
  { category: "Music", label: "First Dance Song Title & Artist", field_type: "text", required: true, gate: "ceremony=Yes" },
  { category: "Music", label: "Parent Dances (Father/Daughter & Mother/Groom)", field_type: "text", required: false },
  { category: "Music", label: "Must-Play Top 10 Song Favorites", field_type: "textarea", required: false },
  { category: "Music", label: "Do Not Play / Banned Song List", field_type: "textarea", required: false },
  { category: "Logistics", label: "Setup Surface (Grass, Concrete, Indoor Gym Floor)", field_type: "select", required: true },
  { category: "Logistics", label: "Dedicated 20A Power Circuit Available Within 50ft", field_type: "checkbox", required: true },
  { category: "Speeches", label: "Toast & Speech Order (Best Man, Maid of Honor, Parents)", field_type: "textarea", required: false },
  { category: "Branding", label: "Photo Booth Monogram / Custom Overlay Text", field_type: "text", required: false },
  { category: "Casino", label: "Casino Night Chip Denominations & Dealer Rules", field_type: "textarea", required: false },
];

// Common Drop-In Timeline Cue Presets Library
const COMMON_TIMELINE_PRESETS: { category: string; title: string; offset_minutes: number; duration_minutes: number }[] = [
  { category: "Load-In", title: "Crew Arrival, Unload & Stage Rig Setup", offset_minutes: -90, duration_minutes: 60 },
  { category: "Safety Check", title: "Electrical Safety Check & Power Meter Test", offset_minutes: -40, duration_minutes: 15 },
  { category: "Sound Check", title: "Sound Check, Wireless Mic & DMX Light Test", offset_minutes: -30, duration_minutes: 20 },
  { category: "Event Start", title: "Doors Open & Guest Arrival Music", offset_minutes: 0, duration_minutes: 30 },
  { category: "Announcements", title: "Grand Entrance & Host Welcome Remarks", offset_minutes: 30, duration_minutes: 15 },
  { category: "Main Program", title: "Dinner Service & Background Playlist", offset_minutes: 45, duration_minutes: 60 },
  { category: "Speeches", title: "Toasts & Open Mic Speeches", offset_minutes: 90, duration_minutes: 20 },
  { category: "Special Moments", title: "First Dance & Formal Traditions", offset_minutes: 110, duration_minutes: 15 },
  { category: "Open Floor", title: "Open Dance Floor & Intelligent Lighting", offset_minutes: 125, duration_minutes: 100 },
  { category: "Wrap-Up", title: "Last Call & Final Farewell Song", offset_minutes: 225, duration_minutes: 15 },
  { category: "Teardown", title: "Event End, Teardown & Van Loadout", offset_minutes: 240, duration_minutes: 45 },
];

export const EventDetailsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("questionnaires");
  const [selectedEventType, setSelectedEventType] = useState("all");

  const [forms, setForms] = useState<QuestionnaireTemplate[]>([]);
  const [timelines, setTimelines] = useState<TimelineTemplate[]>([]);

  // Questionnaire Editor State
  const [showFormModal, setShowFormModal] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formDraft, setFormDraft] = useState<QuestionnaireTemplate>({
    template_name: "",
    event_type: "wedding",
    purpose: "planning",
    active: 1,
    reminder_cadence_days: 3,
    fields: [
      {
        field_key: "pronunciations",
        label: "Phonetic Pronunciations for Entrance Announcements",
        field_type: "text",
        required: true,
      },
      {
        field_key: "first_dance_song",
        label: "First Dance Song Title & Artist",
        field_type: "text",
        required: true,
      },
    ],
  });

  // Timeline Editor State
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [savingTimeline, setSavingTimeline] = useState(false);
  const [timelineDraft, setTimelineDraft] = useState<TimelineTemplate>({
    template_name: "",
    event_type: "wedding",
    active: 1,
    items: [
      { title: "Crew Arrival & Stage Rig Setup", offset_minutes: -90, duration_minutes: 60 },
      { title: "Sound Check & Wireless Mic Test", offset_minutes: -30, duration_minutes: 20 },
      { title: "Guest Arrival & Background Music", offset_minutes: 0, duration_minutes: 30 },
      { title: "Grand Entrance & Announcements", offset_minutes: 30, duration_minutes: 15 },
      { title: "Dinner Service & Toast Mic", offset_minutes: 45, duration_minutes: 60 },
      { title: "Open Dancing & Dance Floor Lights", offset_minutes: 105, duration_minutes: 120 },
      { title: "Last Call & Farewell Song", offset_minutes: 225, duration_minutes: 15 },
    ],
  });

  // Copilot Sandbox State
  const [aiPrompt, setAiPrompt] = useState(
    "Synthesize minute-by-minute timeline moments incorporating sunset at 7:15 PM and noise curfew at 10:00 PM."
  );
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMoments, setAiMoments] = useState<CueItem[] | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formRes, timelineRes] = await Promise.all([
        call("entertainment_express.api.planning.list_form_templates", {}).catch(() => []),
        call("entertainment_express.api.timeline.list_timeline_templates", {}).catch(() => []),
      ]);
      setForms(formRes || []);
      setTimelines(timelineRes || []);
    } catch (err: any) {
      toast({
        title: "Error Loading Templates",
        description: err?.message || "Could not fetch event planning templates.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Templates
  const filteredForms = forms.filter(
    (f) => selectedEventType === "all" || f.event_type === selectedEventType
  );
  const filteredTimelines = timelines.filter(
    (t) => selectedEventType === "all" || t.event_type === selectedEventType
  );

  const totalQuestionsCount = forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0);

  const handleSaveForm = async () => {
    if (!formDraft.template_name) {
      toast({ title: "Template Name Required", description: "Please specify a questionnaire title.", variant: "warning" });
      return;
    }
    setSavingForm(true);
    try {
      await call("entertainment_express.api.planning.save_template", { template: formDraft });
      toast({
        title: "Questionnaire Saved",
        description: `'${formDraft.template_name}' has been created and will automatically attach to confirmed ${formDraft.event_type} bookings.`,
        variant: "success",
      });
      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Could not save questionnaire template.", variant: "danger" });
    } finally {
      setSavingForm(false);
    }
  };

  const handleSaveTimeline = async () => {
    if (!timelineDraft.template_name) {
      toast({ title: "Template Name Required", description: "Please specify a timeline title.", variant: "warning" });
      return;
    }
    setSavingTimeline(true);
    try {
      await call("entertainment_express.api.timeline.save_timeline_template", { template: timelineDraft });
      toast({
        title: "Run of Show Template Saved",
        description: `'${timelineDraft.template_name}' is ready for automated booking assignment.`,
        variant: "success",
      });
      setShowTimelineModal(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Could not save run-of-show template.", variant: "danger" });
    } finally {
      setSavingTimeline(false);
    }
  };

  const handleRunAiSynthesis = async () => {
    setAiGenerating(true);
    try {
      const res = await call("entertainment_express.copilot.timeline_synthesizer.generate_run_of_show", {
        prompt: aiPrompt,
        event_type: "wedding",
      });
      setAiMoments(res?.moments || []);
      toast({
        title: "AI Timeline Synthesized",
        description: `Generated ${res?.moments?.length || 0} run-of-show cues matching event constraints.`,
        variant: "success",
      });
    } catch (err: any) {
      // Fallback synthetic preview
      setAiMoments([
        { title: "AI Setup & Sound Verification", offset_minutes: -60, duration_minutes: 45 },
        { title: "AI Astronomical Sunset Moment (Background Lighting Shift)", offset_minutes: 60, duration_minutes: 30 },
        { title: "AI Noise Curfew Soft-Ducking Phase", offset_minutes: 210, duration_minutes: 30 },
      ]);
      toast({
        title: "Copilot Preview Mode",
        description: "Generated synthetic run-of-show cues for visual inspection.",
        variant: "default",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // Quick Drop Question Helper
  const dropQuestionPreset = (preset: typeof COMMON_QUESTION_PRESETS[0]) => {
    const key = preset.label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const [condField, condVal] = preset.gate ? preset.gate.split("=") : ["", ""];
    const newItem: QuestionField = {
      field_key: key,
      label: preset.label,
      field_type: preset.field_type,
      required: preset.required,
      conditional_on_field: condField || undefined,
      conditional_on_value: condVal || undefined,
    };
    setFormDraft({
      ...formDraft,
      fields: [...(formDraft.fields || []), newItem],
    });
    toast({
      title: "Preset Question Added",
      description: `Added "${preset.label}" to your questionnaire draft.`,
      variant: "success",
    });
  };

  // Quick Drop Timeline Cue Helper
  const dropTimelinePreset = (preset: typeof COMMON_TIMELINE_PRESETS[0]) => {
    const newItem: CueItem = {
      title: preset.title,
      offset_minutes: preset.offset_minutes,
      duration_minutes: preset.duration_minutes,
    };
    setTimelineDraft({
      ...timelineDraft,
      items: [...(timelineDraft.items || []), newItem],
    });
    toast({
      title: "Preset Cue Added",
      description: `Added "${preset.title}" (T${preset.offset_minutes >= 0 ? "+" : ""}${preset.offset_minutes}m) to timeline draft.`,
      variant: "success",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
        <Skeleton width="280px" height="2.5rem" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
        </div>
        <Skeleton height="24rem" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Settings2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)]">
              Event Details & Run of Show Studio
            </h1>
          </div>
          <p className="text-sm text-[var(--ee-muted)]">
            Configure automated client questionnaires, conditional logic gates, and minute-by-minute timeline templates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (activeTab === "questionnaires") setShowFormModal(true);
              else setShowTimelineModal(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {activeTab === "questionnaires" ? "New Questionnaire" : "New Run of Show"}
          </Button>
        </div>
      </div>

      {/* Cockpit KPIs */}
      <StatGrid columns={4}>
        <StatCard
          title="Active Questionnaires"
          value={forms.length}
          subtitle="Form templates online"
          sparkline={<FileText className="w-4 h-4 text-indigo-500" />}
        />
        <StatCard
          title="Total Questions"
          value={totalQuestionsCount}
          subtitle="Client prompts configured"
          sparkline={<ListPlus className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          title="Run of Show Templates"
          value={timelines.length}
          subtitle="Timeline master cues"
          sparkline={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          title="Auto-Reminder Cadence"
          value="3 Days"
          subtitle="Pre-event client dispatch"
          sparkline={<Zap className="w-4 h-4 text-blue-500" />}
        />
      </StatGrid>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--ee-surface)] p-3 rounded-xl border border-[var(--ee-border)]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)] mr-1">
            Filter Vertical:
          </span>
          <button
            onClick={() => setSelectedEventType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedEventType === "all"
                ? "bg-[var(--ee-brand)] text-white shadow-xs"
                : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            All Verticals
          </button>
          {EVENT_TYPES.map((et) => (
            <button
              key={et.id}
              onClick={() => setSelectedEventType(et.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedEventType === et.id
                  ? "bg-[var(--ee-brand)] text-white shadow-xs"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Selector */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          {
            id: "questionnaires",
            label: `Client Questionnaires (${filteredForms.length})`,
            content: (
              <div className="space-y-6">
                {filteredForms.length === 0 ? (
                  <Card className="p-12 text-center bg-[var(--ee-surface)]">
                    <EmptyState
                      icon={<FileText className="w-12 h-12 text-indigo-400 mx-auto" />}
                      title="No Questionnaires Configured"
                      description="Create event questionnaires to collect announcements, song preferences, and logistics directly from clients."
                    />
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => setShowFormModal(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Create First Questionnaire
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Questionnaire Cards List */}
                    <div className="lg:col-span-7 space-y-4">
                      {filteredForms.map((form, idx) => (
                        <Card
                          key={form.name || idx}
                          elevated
                          className="hover:border-[var(--ee-brand)]/50 transition-all"
                        >
                          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--ee-border)]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-bold text-[var(--ee-text)]">
                                  {form.template_name}
                                </CardTitle>
                                <Badge variant={form.active ? "success" : "outline"}>
                                  {form.active ? "Active" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[var(--ee-muted)]">
                                Scoped to <span className="font-semibold capitalize">{form.event_type}</span> · {form.fields?.length || 0} questions · Reminder: every {form.reminder_cadence_days || 3}d
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              density="compact"
                              onClick={() => {
                                setFormDraft(form);
                                setShowFormModal(true);
                              }}
                              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            >
                              Edit Form
                            </Button>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-3">
                            <div className="space-y-2">
                              {(form.fields || []).slice(0, 4).map((f, qIdx) => (
                                <div
                                  key={qIdx}
                                  className="p-2.5 rounded-lg bg-[var(--ee-surface-inset)] flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2 font-medium text-[var(--ee-text)]">
                                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                                      {qIdx + 1}
                                    </span>
                                    <span>{f.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {f.conditional_on_field && (
                                      <Badge variant="warning" className="text-[10px]">
                                        if {f.conditional_on_field}={f.conditional_on_value}
                                      </Badge>
                                    )}
                                    {f.required ? (
                                      <Badge variant="danger" className="text-[10px]">Required</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">Optional</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {(form.fields?.length || 0) > 4 && (
                                <p className="text-xs text-[var(--ee-muted)] text-center pt-1">
                                  + {(form.fields?.length || 0) - 4} more questions in this form
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Live Mobile Preview Card */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-[var(--ee-brand)]" />
                          Client Mobile View Simulation
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          Live Portal
                        </span>
                      </div>

                      <div className="rounded-2xl border border-[var(--ee-border)] bg-slate-950 overflow-hidden shadow-lg p-4 space-y-4">
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                          <span className="text-[11px] font-mono text-emerald-400">
                            https://my-event.entx.app/plan
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                          <div className="border-b border-slate-800 pb-3">
                            <span className="text-xs font-bold text-white block">
                              {filteredForms[0]?.template_name || "Wedding Event Planning Form"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Please complete prior to 7 days before your event.
                            </span>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">
                                1. Phonetic Pronunciations <span className="text-red-400">*</span>
                              </label>
                              <input
                                disabled
                                value="Avery (AY-ver-ee) & Morgan (MOR-gan)"
                                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">
                                2. First Dance Song <span className="text-red-400">*</span>
                              </label>
                              <input
                                disabled
                                value="At Last — Etta James"
                                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                              />
                            </div>

                            <button
                              type="button"
                              disabled
                              className="w-full py-2 rounded-lg bg-[var(--ee-brand)] text-white font-bold text-xs shadow-sm"
                            >
                              Submit Responses →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "timelines",
            label: `Run of Show Templates (${filteredTimelines.length})`,
            content: (
              <div className="space-y-6">
                {filteredTimelines.length === 0 ? (
                  <Card className="p-12 text-center bg-[var(--ee-surface)]">
                    <EmptyState
                      icon={<Clock className="w-12 h-12 text-amber-400 mx-auto" />}
                      title="No Run-of-Show Templates"
                      description="Create minute-by-minute timeline master templates for DJ cues, inflatable setup windows, and stage announcements."
                    />
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => setShowTimelineModal(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Create Master Timeline
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {filteredTimelines.map((tl, idx) => (
                      <Card key={tl.name || idx} elevated className="space-y-4">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--ee-border)]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <CardTitle className="text-base font-bold text-[var(--ee-text)]">
                                {tl.template_name}
                              </CardTitle>
                              <Badge variant={tl.active ? "success" : "outline"}>
                                {tl.active ? "Active Master" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--ee-muted)]">
                              Event Vertical: <span className="font-semibold capitalize">{tl.event_type}</span> · {tl.items?.length || 0} scheduled cues
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            density="compact"
                            onClick={() => {
                              setTimelineDraft(tl);
                              setShowTimelineModal(true);
                            }}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit Cues
                          </Button>
                        </CardHeader>

                        <CardContent className="pt-2 space-y-4">
                          {/* Chronological Cue List */}
                          <div className="relative pl-4 border-l-2 border-indigo-500/30 space-y-3">
                            {(tl.items || []).map((item, cIdx) => {
                              const isPre = item.offset_minutes < 0;
                              const timeLabel = isPre
                                ? `T${item.offset_minutes}m (Pre-Event)`
                                : `T+${item.offset_minutes}m`;
                              return (
                                <div key={cIdx} className="relative flex items-center justify-between text-xs group">
                                  <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-[var(--ee-surface)]" />
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-28 shrink-0">
                                      {timeLabel}
                                    </span>
                                    <span className="font-semibold text-[var(--ee-text)]">
                                      {item.title}
                                    </span>
                                  </div>
                                  <span className="text-[var(--ee-muted)] font-mono text-[11px]">
                                    Duration: {item.duration_minutes || 15} mins
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "copilot",
            label: "AI Copilot Timeline Generator",
            content: (
              <div className="space-y-6 max-w-4xl mx-auto">
                <Card elevated className="p-6 space-y-6 bg-gradient-to-br from-indigo-900/20 via-[var(--ee-surface)] to-[var(--ee-surface)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <h3 className="text-lg font-bold text-[var(--ee-text)]">
                          Autonomous Copilot Run-of-Show Synthesizer
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--ee-muted)]">
                        Generate minute-by-minute timeline moments incorporating client questionnaire answers, astronomical sunset times, and municipal noise curfews.
                      </p>
                    </div>
                    <Badge variant="brand">Autonomous Ops</Badge>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--ee-text)] block">
                      Synthesis Prompt & Environmental Constraints:
                    </label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs font-mono text-[var(--ee-text)]"
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleRunAiSynthesis}
                    loading={aiGenerating}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Synthesize Master Timeline
                  </Button>
                </Card>

                {aiMoments && (
                  <Card className="p-6 space-y-4 border-indigo-500/30">
                    <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
                      <h4 className="font-bold text-sm text-[var(--ee-text)] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Synthesized AI Run-of-Show Cues ({aiMoments.length})
                      </h4>
                      <Badge variant="success">Ready to Apply</Badge>
                    </div>

                    <div className="divide-y divide-[var(--ee-border)] text-xs">
                      {aiMoments.map((m, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-indigo-500 w-24">
                              T+{m.offset_minutes}m
                            </span>
                            <span className="font-semibold text-[var(--ee-text)]">{m.title}</span>
                          </div>
                          <span className="text-[var(--ee-muted)] font-mono">{m.duration_minutes} mins</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Questionnaire Editor Modal */}
      <Dialog
        open={showFormModal}
        onOpenChange={setShowFormModal}
        title={formDraft.name ? "Edit Questionnaire Template" : "New Client Questionnaire"}
        description="Define prompts and conditional rules for client pre-event forms."
      >
        <div className="space-y-4 text-xs py-3 max-w-xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--ee-text)]">Template Title</label>
              <input
                type="text"
                value={formDraft.template_name}
                onChange={(e) => setFormDraft({ ...formDraft, template_name: e.target.value })}
                placeholder="e.g. Wedding Ceremony & Reception Questionnaire"
                className="w-full px-3 py-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-[var(--ee-text)]">Event Vertical</label>
              <select
                value={formDraft.event_type}
                onChange={(e) => setFormDraft({ ...formDraft, event_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Drop Common Question Items Section */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-indigo-400 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5" />
                ⚡ Quick Drop Common Questions Library (Click to Add):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {COMMON_QUESTION_PRESETS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => dropQuestionPreset(p)}
                  className="px-2.5 py-1 rounded-md bg-[var(--ee-surface)] hover:bg-[var(--ee-brand)] hover:text-white border border-[var(--ee-border)] transition-all text-[11px] font-medium flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ee-text)]">Form Questions ({formDraft.fields?.length || 0})</span>
              <Button
                variant="outline"
                density="compact"
                onClick={() =>
                  setFormDraft({
                    ...formDraft,
                    fields: [
                      ...(formDraft.fields || []),
                      { field_key: "", label: "", field_type: "text", required: false },
                    ],
                  })
                }
                leftIcon={<Plus className="w-3 h-3" />}
              >
                Add Custom Question
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(formDraft.fields || []).map((q, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[var(--ee-surface-inset)] space-y-2 border border-[var(--ee-border)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[11px] text-indigo-500">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formDraft.fields.filter((_, i) => i !== idx);
                        setFormDraft({ ...formDraft, fields: updated });
                      }}
                      className="text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => {
                      const updated = [...formDraft.fields];
                      const label = e.target.value;
                      updated[idx] = {
                        ...q,
                        label,
                        field_key: q.field_key || label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
                      };
                      setFormDraft({ ...formDraft, fields: updated });
                    }}
                    placeholder="e.g. Special Requests or Songs to Avoid"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--ee-surface)] border border-[var(--ee-border)] text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={
                        q.conditional_on_field ? `${q.conditional_on_field}=${q.conditional_on_value}` : ""
                      }
                      onChange={(e) => {
                        const [k, ...rest] = e.target.value.split("=");
                        const updated = [...formDraft.fields];
                        updated[idx] = {
                          ...q,
                          conditional_on_field: (k || "").trim(),
                          conditional_on_value: rest.join("=").trim(),
                        };
                        setFormDraft({ ...formDraft, fields: updated });
                      }}
                      placeholder="Gate condition (e.g. ceremony=Yes)"
                      className="px-2 py-1 rounded bg-[var(--ee-surface)] border border-[var(--ee-border)] text-[11px]"
                    />

                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--ee-text)]">
                      <input
                        type="checkbox"
                        checked={Boolean(q.required)}
                        onChange={(e) => {
                          const updated = [...formDraft.fields];
                          updated[idx] = { ...q, required: e.target.checked };
                          setFormDraft({ ...formDraft, fields: updated });
                        }}
                      />
                      Mandatory Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveForm} loading={savingForm}>
              Save Questionnaire
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Timeline Editor Modal */}
      <Dialog
        open={showTimelineModal}
        onOpenChange={setShowTimelineModal}
        title={timelineDraft.name ? "Edit Master Run-of-Show" : "New Run-of-Show Template"}
        description="Configure cue offsets and durations for event execution."
      >
        <div className="space-y-4 text-xs py-3 max-w-xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--ee-text)]">Timeline Master Name</label>
              <input
                type="text"
                value={timelineDraft.template_name}
                onChange={(e) => setTimelineDraft({ ...timelineDraft, template_name: e.target.value })}
                placeholder="e.g. 5-Hour Premium Wedding Run of Show"
                className="w-full px-3 py-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-[var(--ee-text)]">Event Vertical</label>
              <select
                value={timelineDraft.event_type}
                onChange={(e) => setTimelineDraft({ ...timelineDraft, event_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Drop Common Timeline Cues Section */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-amber-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                ⚡ Quick Drop Common Timeline Cues Library (Click to Add):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {COMMON_TIMELINE_PRESETS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => dropTimelinePreset(p)}
                  className="px-2.5 py-1 rounded-md bg-[var(--ee-surface)] hover:bg-amber-500 hover:text-white border border-[var(--ee-border)] transition-all text-[11px] font-medium flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span className="font-mono font-bold text-[10px] opacity-80">
                    T{p.offset_minutes >= 0 ? "+" : ""}{p.offset_minutes}m
                  </span>
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ee-text)]">Timeline Cues ({timelineDraft.items?.length || 0})</span>
              <Button
                variant="outline"
                density="compact"
                onClick={() =>
                  setTimelineDraft({
                    ...timelineDraft,
                    items: [
                      ...(timelineDraft.items || []),
                      { title: "New Cue", offset_minutes: 0, duration_minutes: 15 },
                    ],
                  })
                }
                leftIcon={<Plus className="w-3 h-3" />}
              >
                Add Custom Cue
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(timelineDraft.items || []).map((c, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[var(--ee-surface-inset)] flex items-center gap-2 border border-[var(--ee-border)]">
                  <input
                    type="number"
                    value={c.offset_minutes}
                    onChange={(e) => {
                      const updated = [...timelineDraft.items];
                      updated[idx] = { ...c, offset_minutes: Number(e.target.value) || 0 };
                      setTimelineDraft({ ...timelineDraft, items: updated });
                    }}
                    placeholder="Offset (m)"
                    className="w-20 px-2 py-1 rounded bg-[var(--ee-surface)] border border-[var(--ee-border)] font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => {
                      const updated = [...timelineDraft.items];
                      updated[idx] = { ...c, title: e.target.value };
                      setTimelineDraft({ ...timelineDraft, items: updated });
                    }}
                    placeholder="Cue title (e.g. Grand Entrance)"
                    className="flex-1 px-2.5 py-1 rounded bg-[var(--ee-surface)] border border-[var(--ee-border)] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = timelineDraft.items.filter((_, i) => i !== idx);
                      setTimelineDraft({ ...timelineDraft, items: updated });
                    }}
                    className="text-red-400 hover:text-red-500 px-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
            <Button variant="secondary" onClick={() => setShowTimelineModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTimeline} loading={savingTimeline}>
              Save Run of Show
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
