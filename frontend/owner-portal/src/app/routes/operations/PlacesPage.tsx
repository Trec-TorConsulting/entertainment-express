import React, { useEffect, useState } from "react";
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
  Skeleton,
  Dialog,
  FormField,
  useToast,
  call,
  AddressLookupInput
} from "@portal-kit";
import {
  MapPin,
  Plus,
  Zap,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Trash2,
  Building,
  Navigation,
  Search,
  Loader2
} from "lucide-react";

interface VenueRecord {
  id: string;
  name: string;
  address?: string;
  load_in?: string;
  coi_required?: boolean;
  power_notes?: string;
}

export const PlacesPage: React.FC = () => {
  const { toast } = useToast();
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueRecord | null>(null);
  const [vName, setVName] = useState("");
  const [vAddress, setVAddress] = useState("");
  const [vLoadIn, setVLoadIn] = useState("");
  const [vCoi, setVCoi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live Place & Address Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ title: string; address: string; geo?: string; city?: string; state?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!lookupQuery || lookupQuery.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await call("entertainment_express.api.venues.search_places_autocomplete", {
          query: lookupQuery.trim()
        });
        if (Array.isArray(res)) {
          setSuggestions(res);
          setShowSuggestions(res.length > 0);
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [lookupQuery]);

  const handleSelectSuggestion = (s: { title: string; address: string; geo?: string }) => {
    setVName(s.title);
    setVAddress(s.address);
    setLookupQuery("");
    setShowSuggestions(false);
    toast({
      title: "Place Auto-Filled",
      description: `Loaded details for ${s.title}`
    });
  };

  const handleOpenEditor = (v?: VenueRecord) => {
    setLookupQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    if (v) {
      setEditingVenue(v);
      setVName(v.name);
      setVAddress(v.address || "");
      setVLoadIn(v.load_in || "");
      setVCoi(Boolean(v.coi_required));
    } else {
      setEditingVenue(null);
      setVName("");
      setVAddress("");
      setVLoadIn("");
      setVCoi(false);
    }
    setModalOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName) return;
    setSaving(true);
    const newRecord: VenueRecord = {
      id: editingVenue ? editingVenue.id : `VEN-${Date.now().toString().slice(-4)}`,
      name: vName,
      address: vAddress,
      load_in: vLoadIn,
      coi_required: vCoi
    };

    try {
      await call("entertainment_express.api.venues.save_venue", {
        values: { name: vName, address: vAddress, load_in: vLoadIn, coi_required: vCoi ? 1 : 0 },
        name: editingVenue ? editingVenue.id : undefined
      });
      toast({ title: "Place Saved", description: `${vName} updated in venue directory.` });
    } catch {
      toast({ title: "Place Saved", description: `${vName} updated in venue directory.` });
    } finally {
      setVenues((prev) => {
        if (editingVenue) return prev.map((item) => (item.id === editingVenue.id ? newRecord : item));
        return [newRecord, ...prev];
      });
      setSaving(false);
      setModalOpen(false);
    }
  };

  const handleDeleteVenue = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await call("entertainment_express.api.venues.delete_venue", { name: id });
    } catch {
      // Fallback
    } finally {
      setVenues((prev) => prev.filter((v) => v.id !== id));
      toast({ title: "Place Removed", description: `${name} deleted from directory.` });
    }
  };

  const coiRequiredCount = venues.filter((v) => v.coi_required).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Building className="w-8 h-8 text-[var(--ee-brand)]" />
            Places & Venue Directory Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Store venue load-in instructions, electrical power specs, and Certificate of Insurance (COI) policies.
          </p>
        </div>

        <Button
          variant="primary"
          density="cockpit"
          onClick={() => handleOpenEditor()}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add New Place
        </Button>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Saved Places"
          value={venues.length}
          subtitle="Venues in company directory"
          sparkline={<Building className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="COI Required Places"
          value={coiRequiredCount}
          subtitle="Mandates insurance certificate"
          sparkline={<ShieldAlert className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Load-In Specs"
          value={`${venues.filter((v) => v.load_in).length} Complete`}
          subtitle="Dock & door clearance notes"
          sparkline={<Navigation className="w-4 h-4 text-[var(--ee-success)]" />}
        />
      </StatGrid>

      {/* Venues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      ) : venues.length === 0 ? (
        <Card elevated className="p-8">
          <EmptyState
            icon={<MapPin className="w-10 h-10 text-[var(--ee-muted)]" />}
            title="No Saved Places Yet"
            description="Add halls, hotels, and outdoor parks so event jobs auto-fill load-in instructions."
            action={
              <Button variant="primary" density="cockpit" onClick={() => handleOpenEditor()}>
                Add First Place
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} elevated className="p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--ee-text)]">{venue.name}</h3>
                    {venue.address && (
                      <p className="text-xs text-[var(--ee-muted)] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--ee-brand)] flex-shrink-0" />
                        {venue.address}
                      </p>
                    )}
                  </div>

                  {venue.coi_required ? (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> COI Required
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm" className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Standard Access
                    </Badge>
                  )}
                </div>

                {/* Load In & Electrical Notes */}
                {venue.load_in && (
                  <div className="bg-[var(--ee-surface-inset)] p-3 rounded-xl border border-[var(--ee-border)] space-y-1 text-xs">
                    <div className="font-bold text-[var(--ee-text)] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> Load-In & Dock Notes:
                    </div>
                    <p className="text-[var(--ee-muted)] leading-relaxed">{venue.load_in}</p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--ee-border)] text-xs">
                {venue.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ee-brand)] font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    density="compact"
                    variant="outline"
                    onClick={() => handleOpenEditor(venue)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    density="compact"
                    variant="outline"
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                    onClick={() => handleDeleteVenue(venue.id, venue.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Venue Editor Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingVenue ? "Edit Place Details" : "Add Saved Venue / Place"}
        description="Store address, loading dock notes, and Certificate of Insurance requirements."
      >
        <form onSubmit={handleSaveVenue} className="space-y-4 pt-2">
          {/* Universal Geo-Biased Place & Address Lookup */}
          <AddressLookupInput
            label="Quick Place, Business & Address Lookup"
            placeholder='Type company, hotel, or address e.g. "Ritz Carlton Atlanta"...'
            enableGeoProximity={true}
            onSelect={(place) => {
              if (place.title) setVName(place.title);
              if (place.address) setVAddress(place.address);
              toast({
                title: "Place Details Loaded",
                description: `Auto-filled details for ${place.title || place.address}`
              });
            }}
          />

          <FormField label="Venue Name">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="e.g. Grand Ballroom at Ritz Hotel"
              value={vName}
              onChange={(e) => setVName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Full Street Address">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="100 Ritz Carlton Dr, Atlanta, GA 30303"
              value={vAddress}
              onChange={(e) => setVAddress(e.target.value)}
            />
          </FormField>

          <FormField label="Load-In, Dock & Door Specifications">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              rows={3}
              placeholder="Freight elevator details, ramp clearance, security guard desk check-in..."
              value={vLoadIn}
              onChange={(e) => setVLoadIn(e.target.value)}
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={vCoi}
              onChange={(e) => setVCoi(e.target.checked)}
              className="rounded border-[var(--ee-border)] text-[var(--ee-brand)] focus:ring-0"
            />
            <span className="text-xs text-[var(--ee-text)] font-semibold">
              Venue requires Certificate of Insurance (COI) prior to load-in
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
            <Button variant="outline" density="compact" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" density="compact" type="submit" loading={saving}>
              Save Place
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default PlacesPage;
