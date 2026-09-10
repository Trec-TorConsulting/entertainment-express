import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  PageHeader,
  Tabs,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Textarea,
  useToast,
  Skeleton,
  Dialog,
  call
} from "@portal-kit";
import {
  Clock, Music, Heart, Users, Sparkles,
  Save, Search, Plus, Trash2, CheckCircle2,
  ThumbsUp, Calendar, AlertCircle, HelpCircle
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";
import { getSessionBootstrap } from "@portal-kit";

export const PlanningPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [events, setEvents] = useState<any[]>([]);
  const [booking, setBooking] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("music");

  // Music State
  const [selections, setSelections] = useState<any[]>([]);
  const [musicCategory, setMusicCategory] = useState<string>("must_play");
  const [newSongTitle, setNewSongTitle] = useState("");
  const [specialMomentLabel, setSpecialMomentLabel] = useState("First Dance");
  const [curatedPlaylists, setCuratedPlaylists] = useState<any[]>([]);
  const [musicLoading, setMusicLoading] = useState(false);

  // Timeline State
  const [timeline, setTimeline] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [changeDialogItem, setChangeDialogItem] = useState<{ idx: number; title: string; current_time: string } | null>(null);
  const [suggestedTime, setSuggestedTime] = useState("");
  const [suggestedNotes, setSuggestedNotes] = useState("");

  // Questionnaires State
  const [formInstances, setFormInstances] = useState<any[]>([]);
  const [activeFormInstance, setActiveFormInstance] = useState<any>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  // Collaborative Voting State
  const [collabItems, setCollabItems] = useState<any[]>([]);
  const [newCollabTitle, setNewCollabTitle] = useState("");
  const [newCollabNotes, setNewCollabNotes] = useState("");

  const bookingParam = searchParams.get("booking");

  useEffect(() => {
    const init = async () => {
      try {
        const evList = await call("entertainment_express.api.portal_collaboration.list_my_events", {});
        const evs = evList || [];
        setEvents(evs);
        const selected = bookingParam || evs[0]?.name || "";
        setBooking(selected);

        if (selected) {
          await loadBookingPlanning(selected);
        }
      } catch {
        // Fallbacks
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [bookingParam]);

  const loadBookingPlanning = async (bookingName: string) => {
    try {
      const [musicRes, curRes, timeRes, formsRes, collabRes] = await Promise.allSettled([
        call("entertainment_express.api.music.list_selections", { booking_name: bookingName }),
        call("entertainment_express.api.music.curated_lists", {}),
        call("entertainment_express.api.timeline.get_timeline", { booking_name: bookingName }),
        call("entertainment_express.api.planning.list_forms", { booking_name: bookingName }),
        call("entertainment_express.api.portal_collaboration.list_plan_items", { booking: bookingName })
      ]);

      if (musicRes.status === "fulfilled") setSelections(musicRes.value || []);
      if (curRes.status === "fulfilled") setCuratedPlaylists(curRes.value || []);
      if (timeRes.status === "fulfilled") setTimeline(timeRes.value || null);
      if (collabRes.status === "fulfilled") setCollabItems(collabRes.value || []);

      if (formsRes.status === "fulfilled") {
        const fList = formsRes.value || [];
        setFormInstances(fList);
        if (fList.length > 0) {
          const firstForm = await call("entertainment_express.api.planning.get_form", {
            booking_name: bookingName,
            instance_name: fList[0].name
          }).catch(() => null);
          if (firstForm) {
            setActiveFormInstance(firstForm);
            const ansMap: Record<string, any> = {};
            (firstForm.answers || []).forEach((a: any) => {
              ansMap[a.field_key] = a.value;
            });
            setFormAnswers(ansMap);
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  // Music Handlers
  const handleAddSong = async () => {
    if (!newSongTitle.trim() || !booking) return;
    setMusicLoading(true);
    try {
      await call("entertainment_express.api.music.add_selection", {
        booking_name: booking,
        category: musicCategory,
        free_text: newSongTitle.trim(),
        moment: musicCategory === "special_moment" ? specialMomentLabel : ""
      });
      setNewSongTitle("");
      const updated = await call("entertainment_express.api.music.list_selections", { booking_name: booking });
      setSelections(updated || []);
      toast({ title: "Song Added", description: "Your selection was added to the event music sheet.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Could Not Add Song", description: err.message || "An error occurred.", variant: "danger" });
    } finally {
      setMusicLoading(false);
    }
  };

  const handleRemoveSong = async (name: string) => {
    try {
      await call("entertainment_express.api.music.remove_selection", { name });
      setSelections((prev) => prev.filter((s) => s.name !== name));
      toast({ title: "Song Removed", description: "Track removed from your requests.", variant: "brand" });
    } catch (err: any) {
      toast({ title: "Remove Failed", description: err.message || "Error removing song.", variant: "danger" });
    }
  };

  // Timeline Change Suggestion
  const handleSuggestTimelineChange = async () => {
    if (!changeDialogItem || !booking) return;
    try {
      await call("entertainment_express.api.timeline.suggest_change", {
        booking_name: booking,
        item_idx: changeDialogItem.idx,
        payload: {
          start_time: suggestedTime || changeDialogItem.current_time,
          description: suggestedNotes
        }
      });
      toast({
        title: "Change Request Submitted",
        description: `Suggested time adjustment for '${changeDialogItem.title}' sent to your event coordinator.`,
        variant: "success",
      });
      setChangeDialogItem(null);
      setSuggestedTime("");
      setSuggestedNotes("");
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Could not submit suggestion.", variant: "danger" });
    }
  };

  // Questionnaire Save
  const handleSaveAnswers = async () => {
    if (!activeFormInstance?.instance?.name) return;
    setSavingAnswers(true);
    try {
      await call("entertainment_express.api.planning.save_answers", {
        instance_name: activeFormInstance.instance.name,
        answers: formAnswers
      });
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 3000);
      toast({ title: "Planning Saved", description: "Your responses have been saved and synced with crew run sheets.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message || "Could not save planning answers.", variant: "danger" });
    } finally {
      setSavingAnswers(false);
    }
  };

  // Collab Suggest & Vote
  const handleAddCollab = async () => {
    if (!newCollabTitle.trim() || !booking) return;
    try {
      await call("entertainment_express.api.portal_collaboration.suggest_plan_item", {
        booking,
        title: newCollabTitle.trim(),
        notes: newCollabNotes.trim()
      });
      setNewCollabTitle("");
      setNewCollabNotes("");
      const updated = await call("entertainment_express.api.portal_collaboration.list_plan_items", { booking });
      setCollabItems(updated || []);
      toast({ title: "Suggestion Posted", description: "Item added for voting and coordinator review.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed to Suggest", description: err.message || "Could not post suggestion.", variant: "danger" });
    }
  };

  const handleVote = async (planItemName: string) => {
    try {
      await call("entertainment_express.api.portal_collaboration.vote_plan_item", {
        booking,
        plan_item: planItemName
      });
      const updated = await call("entertainment_express.api.portal_collaboration.list_plan_items", { booking });
      setCollabItems(updated || []);
      toast({ title: "Vote Cast", description: "Your vote was registered!", variant: "brand" });
    } catch (err: any) {
      toast({ title: "Vote Registered", description: err.message || "Already voted on this item.", variant: "brand" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="16rem" />
      </div>
    );
  }

  const activeEvent = events.find((e) => e.name === booking) || events[0];

  // Music Tab View
  const musicTabView = (
    <div className="space-y-6">
      {/* Category Pills & Input */}
      <Card elevated className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { id: "must_play", label: "Must-Play" },
              { id: "do_not_play", label: "Do-Not-Play" },
              { id: "special_moment", label: "Special Moments" },
              { id: "general_request", label: "General Requests" }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMusicCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  musicCategory === cat.id
                    ? "bg-[var(--ee-brand)] text-white shadow-sm"
                    : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {musicCategory === "special_moment" && (
            <select
              value={specialMomentLabel}
              onChange={(e) => setSpecialMomentLabel(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)]"
            >
              <option value="First Dance">First Dance</option>
              <option value="Grand Entrance">Grand Entrance</option>
              <option value="Parent Dance">Father / Mother Dance</option>
              <option value="Cake Cutting">Cake Cutting</option>
              <option value="Bouquet Toss">Bouquet / Garter Toss</option>
              <option value="Last Dance">Last Dance</option>
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
            placeholder={
              musicCategory === "do_not_play"
                ? "Enter track to ban (e.g., 'Chicken Dance', 'Macarena')..."
                : "Enter song title & artist or paste Spotify link..."
            }
            density="consumer"
            onKeyDown={(e) => e.key === "Enter" && handleAddSong()}
          />
          <Button
            variant="primary"
            density="consumer"
            onClick={handleAddSong}
            disabled={musicLoading || !newSongTitle.trim()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Song
          </Button>
        </div>
      </Card>

      {/* Selected Songs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["must_play", "special_moment", "do_not_play", "general_request"].map((cat) => {
          const list = selections.filter((s) => s.category === cat);
          const title =
            cat === "must_play"
              ? "Must-Play Anthems"
              : cat === "special_moment"
              ? "Special Moments"
              : cat === "do_not_play"
              ? "Do-Not-Play Banned Tracks"
              : "Guest Requests";

          return (
            <Card key={cat} elevated className="p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--ee-border)] pb-2">
                <span className="font-semibold text-xs text-[var(--ee-text)]">{title}</span>
                <Badge variant={cat === "do_not_play" ? "danger" : "brand"} size="sm">
                  {list.length}
                </Badge>
              </div>

              {list.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {list.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--ee-surface-inset)] text-xs group"
                    >
                      <div className="truncate pr-2">
                        <span className="font-medium text-[var(--ee-text)] block truncate">
                          {item.free_text || item.song}
                        </span>
                        {item.moment && (
                          <span className="text-[10px] text-[var(--ee-brand)] uppercase font-semibold">
                            Moment: {item.moment}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSong(item.name)}
                        className="opacity-60 group-hover:opacity-100 hover:text-[var(--ee-danger)] p-1 text-[var(--ee-muted)]"
                        title="Remove song"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--ee-muted)] italic py-2 text-center">
                  No tracks listed yet. Add favorites above!
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Timeline Tab View
  const timelineTabView = (
    <div className="space-y-4">
      <Card elevated className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-sm text-[var(--ee-text)]">Event Day Run-of-Show</h3>
            <p className="text-xs text-[var(--ee-muted)]">Timezone: {timeline?.timezone || "America/New_York"}</p>
          </div>
          <Badge variant={timeline?.status === "finalized" ? "success" : "brand"} size="sm">
            {timeline?.status || "In Draft"}
          </Badge>
        </div>

        {timeline?.items && timeline.items.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--ee-border)]">
            {timeline.items.map((item: any, idx: number) => (
              <div key={idx} className="relative pl-8 flex items-start justify-between gap-4 group">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[var(--ee-brand)] ring-4 ring-[var(--ee-surface-base)]" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--ee-brand)]">
                      {item.start_time?.slice(0, 5) || "00:00"}
                    </span>
                    <h5 className="font-semibold text-xs text-[var(--ee-text)]">{item.title}</h5>
                  </div>
                  {item.description && (
                    <p className="text-xs text-[var(--ee-muted)] leading-relaxed">{item.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  density="consumer"
                  onClick={() =>
                    setChangeDialogItem({
                      idx,
                      title: item.title,
                      current_time: item.start_time?.slice(0, 5) || "18:00"
                    })
                  }
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  Suggest Change
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--ee-muted)] text-center py-6">
            Timeline items will appear here once configured by your lead entertainer.
          </p>
        )}
      </Card>

      {/* Suggest Change Modal Dialog */}
      {changeDialogItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card elevated className="max-w-md w-full p-6 space-y-4 bg-[var(--ee-surface-raised)] animate-in fade-in-50">
            <h3 className="font-bold text-base text-[var(--ee-text)]">
              Suggest Change for: {changeDialogItem.title}
            </h3>
            <div className="space-y-3">
              <FormField label="Proposed Start Time">
                <Input
                  type="time"
                  value={suggestedTime || changeDialogItem.current_time}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                  density="consumer"
                />
              </FormField>
              <FormField label="Notes for Event Coordinator">
                <Textarea
                  value={suggestedNotes}
                  onChange={(e) => setSuggestedNotes(e.target.value)}
                  placeholder="Reason for adjustment (e.g., speeches moved up by 15 mins)..."
                  density="consumer"
                  rows={3}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" density="consumer" onClick={() => setChangeDialogItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" density="consumer" onClick={handleSuggestTimelineChange}>
                Submit Change Suggestion
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // Questionnaires Tab View
  const questionnaireTabView = (
    <div className="space-y-6">
      {activeFormInstance?.template ? (
        <Card elevated className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ee-border)] pb-4">
            <div>
              <h3 className="font-bold text-base text-[var(--ee-text)]">
                {activeFormInstance.template.template_name || "Event Planning Questionnaire"}
              </h3>
              <p className="text-xs text-[var(--ee-muted)]">
                {activeFormInstance.template.purpose || "Help us tailor your production logistics."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {savedBadge && (
                <Badge variant="success" size="sm">✓ Saved to Run Sheet</Badge>
              )}
              <Button
                variant="primary"
                density="consumer"
                onClick={handleSaveAnswers}
                disabled={savingAnswers}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {savingAnswers ? "Saving…" : "Save Responses"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {(activeFormInstance.fields || []).map((field: any) => {
              const currentVal = formAnswers[field.field_key] || "";
              return (
                <div key={field.field_key} className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--ee-text)] block">
                    {field.label} {field.required && <span className="text-[var(--ee-danger)]">*</span>}
                  </label>
                  {field.help_text && (
                    <span className="text-[10px] text-[var(--ee-muted)] block mb-1">{field.help_text}</span>
                  )}
                  {field.field_type === "Textarea" ? (
                    <Textarea
                      value={currentVal}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.field_key]: e.target.value })}
                      density="consumer"
                      rows={3}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : field.field_type === "Select" ? (
                    <select
                      value={currentVal}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.field_key]: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)]"
                    >
                      <option value="">Select option...</option>
                      {(field.options || "").split("\n").map((opt: string) => (
                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={currentVal}
                      onChange={(e) => setFormAnswers({ ...formAnswers, [field.field_key]: e.target.value })}
                      density="consumer"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card elevated className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[var(--ee-success)] mx-auto" />
          <h4 className="font-semibold text-sm text-[var(--ee-text)]">Questionnaires Up to Date</h4>
          <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
            All required planning sheets for this event are complete.
          </p>
        </Card>
      )}
    </div>
  );

  // Group Voting Tab View
  const collaborationTabView = (
    <div className="space-y-6">
      <Card elevated className="p-6 space-y-4">
        <h4 className="font-bold text-sm text-[var(--ee-text)]">Suggest an Activity or Moment for Group Vote</h4>
        <div className="space-y-3">
          <Input
            value={newCollabTitle}
            onChange={(e) => setNewCollabTitle(e.target.value)}
            placeholder="E.g., Group photo after cake cutting, Shoe Game during dinner..."
            density="consumer"
          />
          <Textarea
            value={newCollabNotes}
            onChange={(e) => setNewCollabNotes(e.target.value)}
            placeholder="Optional context or instructions..."
            density="consumer"
            rows={2}
          />
          <Button
            variant="primary"
            density="consumer"
            onClick={handleAddCollab}
            disabled={!newCollabTitle.trim()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Submit Idea for Vote
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {collabItems.length > 0 ? (
          collabItems.map((item) => (
            <Card key={item.name} elevated className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-xs text-[var(--ee-text)]">{item.title}</h5>
                  <Badge variant="outline" size="sm">By {item.source}</Badge>
                </div>
                {item.notes && <p className="text-xs text-[var(--ee-muted)]">{item.notes}</p>}
              </div>
              <Button
                variant="secondary"
                density="consumer"
                onClick={() => handleVote(item.name)}
                leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}
              >
                Vote ({item.votes || 0})
              </Button>
            </Card>
          ))
        ) : (
          <p className="text-xs text-[var(--ee-muted)] text-center py-6">
            No group suggestions yet. Post an idea above!
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Event Planning Hub"
            subtitle={`Coordinating music, timeline, and run sheet details for ${activeEvent?.event_name || "your event"}.`}
            badge={<Badge variant="brand">{activeEvent?.name || "Booking"}</Badge>}
          />
        </div>

        {events.length > 1 && (
          <select
            value={booking}
            onChange={(e) => {
              setBooking(e.target.value);
              loadBookingPlanning(e.target.value);
            }}
            className="text-xs p-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] max-w-xs"
          >
            {events.map((ev) => (
              <option key={ev.name} value={ev.name}>
                {ev.event_name || ev.name} ({ev.event_date || "Date Pending"})
              </option>
            ))}
          </select>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "music", label: "Music & Songs", icon: <Music className="w-4 h-4" />, content: musicTabView },
          { id: "timeline", label: "Run-of-Show", icon: <Clock className="w-4 h-4" />, content: timelineTabView },
          { id: "questionnaire", label: "Questionnaires", icon: <CheckCircle2 className="w-4 h-4" />, content: questionnaireTabView },
          { id: "collab", label: "Group Ideas & Voting", icon: <Users className="w-4 h-4" />, content: collaborationTabView },
        ]}
      />
    </div>
  );
};

export default PlanningPage;
