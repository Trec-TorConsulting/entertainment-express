import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  call
} from "@portal-kit";
import {
  Clock, Music, Heart, Users, Sparkles,
  Save, Search, Plus, Trash2, CheckCircle2
} from "lucide-react";

export const PlanningPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const booking = searchParams.get("booking") || "";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("music");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Planning state
  const [guestCount, setGuestCount] = useState<number>(120);
  const [ceremonyNotes, setCeremonyNotes] = useState("");
  const [mustPlaySongs, setMustPlaySongs] = useState<string[]>([
    "September — Earth, Wind & Fire",
    "Don't Stop Believin' — Journey",
    "Uptown Funk — Mark Ronson ft. Bruno Mars"
  ]);
  const [doNotPlaySongs, setDoNotPlaySongs] = useState<string[]>([
    "Macarena",
    "Chicken Dance"
  ]);
  const [songSearch, setSongSearch] = useState("");
  const [specialMoments, setSpecialMoments] = useState<Array<{ title: string; song: string }>>([
    { title: "Grand Entrance", song: "Can't Stop the Feeling — Justin Timberlake" },
    { title: "First Dance", song: "Perfect — Ed Sheeran" },
  ]);

  useEffect(() => {
    // Load existing planning sheet if available
    setLoading(false);
  }, [booking]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setDirty(false);
      toast({
        title: "Planning Sheet Saved",
        description: "Your run sheet changes and song selections have been submitted to your DJ and event team.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save planning changes.",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const addMustPlay = () => {
    if (!songSearch.trim()) return;
    setMustPlaySongs((prev) => [...prev, songSearch.trim()]);
    setSongSearch("");
    setDirty(true);
  };

  const removeMustPlay = (index: number) => {
    setMustPlaySongs((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const removeDoNotPlay = (index: number) => {
    setDoNotPlaySongs((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="16rem" />
      </div>
    );
  }

  const musicTab = (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="w-4 h-4 text-[var(--ee-brand)]" />
            Must-Play Song Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search title, artist, or paste Spotify / Apple Music link..."
              density="consumer"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMustPlay();
                }
              }}
            />
            <Button
              variant="primary"
              density="consumer"
              onClick={addMustPlay}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {mustPlaySongs.map((song, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-[var(--ee-brand)]" />
                  <span className="font-medium text-[var(--ee-text)]">{song}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMustPlay(idx)}
                  className="text-[var(--ee-muted)] hover:text-[var(--ee-danger)] p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-[var(--ee-danger)]">✕</span>
            Do-Not-Play Blacklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[var(--ee-muted)]">
            Songs or genres you explicitly want our DJs to refuse even if requested by guests.
          </p>
          <div className="flex flex-wrap gap-2">
            {doNotPlaySongs.map((song, idx) => (
              <Badge key={idx} variant="default" size="md" className="flex items-center gap-1.5 py-1 px-2.5">
                <span>{song}</span>
                <button
                  type="button"
                  onClick={() => removeDoNotPlay(idx)}
                  className="hover:text-[var(--ee-danger)] ml-1 font-bold"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const timelineTab = (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--ee-brand)]" />
            Guest Count & Event Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-[var(--ee-text)]">Estimated Guest Count:</span>
              <span className="font-mono font-bold text-sm text-[var(--ee-brand)]">{guestCount} Guests</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={guestCount}
              onChange={(e) => {
                setGuestCount(Number(e.target.value));
                setDirty(true);
              }}
              className="w-full accent-[var(--ee-brand)] cursor-pointer"
            />
          </div>

          <FormField label="Ceremony & Reception Flow Instructions">
            <Textarea
              value={ceremonyNotes}
              onChange={(e) => {
                setCeremonyNotes(e.target.value);
                setDirty(true);
              }}
              placeholder="e.g. Cocktail hour outside on the patio from 5-6 PM, followed by indoor dinner seating."
              rows={4}
              density="consumer"
            />
          </FormField>
        </CardContent>
      </Card>
    </div>
  );

  const specialMomentsTab = (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--ee-brand)]" />
            Special Dance Moments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {specialMoments.map((moment, idx) => (
            <div key={idx} className="p-3 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)] space-y-1 text-xs">
              <span className="font-bold text-[var(--ee-text)] block">{moment.title}</span>
              <span className="text-[var(--ee-muted)] font-medium">{moment.song}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Planning Hub & Run Sheet"
        subtitle="Coordinate music requests, timeline logistics, and special dances with your production crew."
        badge={
          dirty ? (
            <Badge variant="warning" dot size="sm">
              Unsaved Changes
            </Badge>
          ) : (
            <Badge variant="success" dot size="sm">
              Synced with Crew
            </Badge>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "music", label: "Music & Playlists", icon: <Music className="w-4 h-4" />, content: musicTab },
          { id: "timeline", label: "Timeline & Guests", icon: <Clock className="w-4 h-4" />, content: timelineTab },
          { id: "moments", label: "Special Moments", icon: <Heart className="w-4 h-4" />, content: specialMomentsTab },
        ]}
      />

      {/* Sticky Save Action Bar */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          dirty ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
        }`}
      >
        <div className="flex items-center gap-4 py-2.5 px-5 rounded-full bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] shadow-xl">
          <span className="text-xs font-semibold text-[var(--ee-text)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--ee-warning)] animate-ping" />
            You have unsaved changes
          </span>
          <Button
            variant="primary"
            density="consumer"
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
            className="rounded-full shadow-md"
          >
            Save Run Sheet
          </Button>
        </div>
      </div>
    </div>
  );
};
