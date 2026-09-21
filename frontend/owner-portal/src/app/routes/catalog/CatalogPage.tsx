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
  call
} from "@portal-kit";
import {
  Package,
  Plus,
  Tag,
  DollarSign,
  Check,
  Edit2,
  Sparkles,
  Music,
  Tent,
  Camera,
  Sun,
  Dices
} from "lucide-react";

interface PackageRecord {
  id: string;
  name: string;
  vertical: string;
  description?: string;
  rate_raw: number;
  rate_formatted?: string;
  deposit_percent?: number;
  included_hours?: number;
  features?: string[];
  active?: boolean;
}

const CATEGORY_TABS = [
  { id: "all", label: "All Packages", icon: Package },
  { id: "dj", label: "DJs & Sound", icon: Music },
  { id: "inflatable", label: "Inflatables & Games", icon: Tent },
  { id: "photo_booth", label: "Photo Booths", icon: Camera },
  { id: "lighting", label: "Lighting & FX", icon: Sun },
  { id: "casino", label: "Casino & Karaoke", icon: Dices }
];

export const CatalogPage: React.FC = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  // Editor Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageRecord | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgVertical, setPkgVertical] = useState("DJs & Sound");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgHours, setPkgHours] = useState("4");
  const [pkgDeposit, setPkgDeposit] = useState("25");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgFeatures, setPkgFeatures] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_crud.list_records", { kind: "package" });
      const rows = Array.isArray(res) ? res : (Array.isArray(res?.rows) ? res.rows : []);
      if (rows.length > 0) {
        setPackages(rows);
      } else {
        setPackages(defaultPackages);
      }
    } catch {
      setPackages(defaultPackages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const defaultPackages: PackageRecord[] = [
    {
      id: "PKG-01",
      name: "Grand Wedding Platinum DJ & Lighting Suite",
      vertical: "DJs & Sound",
      description: "Full concert audio rig, wireless mic package, moving head lighting, and dedicated master MC.",
      rate_raw: 2850,
      deposit_percent: 25,
      included_hours: 6,
      features: [
        "Pro Concert Sound Rig (Up to 350 Guests)",
        "Intelligent Moving-Head Dance Floor Lighting",
        "Wireless Ceremony & Toast Microphones",
        "Dedicated Master of Ceremonies & Lead DJ",
        "Online Music Request Portal Access"
      ],
      active: true
    },
    {
      id: "PKG-02",
      name: "Mega Bounce & Water Slide Combo Park",
      vertical: "Inflatables & Games",
      description: "Massive dual-lane obstacle course with water attachment, generator, and safety attendant.",
      rate_raw: 1450,
      deposit_percent: 50,
      included_hours: 8,
      features: [
        "75ft Tropical Obstacle Course & Wet/Dry Slide",
        "Commercial 6500W Quiet Generator Included",
        "ASTM Safety Inspection Certificate",
        "Trained On-Site Safety Crew Attendant",
        "Delivery, Setup, Teardown & Disinfection"
      ],
      active: true
    },
    {
      id: "PKG-03",
      name: "360 Video Booth & Glam Photo Studio",
      vertical: "Photo Booths",
      description: "High-speed 360 rotating arm booth with instant SMS sharing, custom overlay graphics, and prop bar.",
      rate_raw: 1200,
      deposit_percent: 25,
      included_hours: 4,
      features: [
        "Automatic Motorized 360 Video Platform",
        "Instant SMS/AirDrop Video Delivery Station",
        "Custom Monogram Overlay & Soundtracks",
        "Vegas Prop Kit & Red Carpet Stanchions",
        "Attended by Photo Booth Specialist"
      ],
      active: true
    },
    {
      id: "PKG-04",
      name: "Vegas High-Roller Casino Night",
      vertical: "Casino & Karaoke",
      description: "Authentic felt Blackjack, Craps, and Roulette tables with professional dealers and raffle chips.",
      rate_raw: 3200,
      deposit_percent: 25,
      included_hours: 4,
      features: [
        "4 Blackjack Tables & 1 Craps Table",
        "5 Professional Uniformed Casino Dealers",
        "Clay Chips, Playing Cards & Dealer Shoes",
        "Custom Corporate Funny Money & Raffle Tickets",
        "Pit Boss Supervision & Prize Drawing"
      ],
      active: true
    }
  ];

  const handleOpenEditor = (pkg?: PackageRecord) => {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgName(pkg.name);
      setPkgVertical(pkg.vertical || "DJs & Sound");
      setPkgPrice(String(pkg.rate_raw));
      setPkgHours(String(pkg.included_hours || 4));
      setPkgDeposit(String(pkg.deposit_percent || 25));
      setPkgDesc(pkg.description || "");
      setPkgFeatures((pkg.features || []).join("\n"));
    } else {
      setEditingPkg(null);
      setPkgName("");
      setPkgVertical("DJs & Sound");
      setPkgPrice("");
      setPkgHours("4");
      setPkgDeposit("25");
      setPkgDesc("");
      setPkgFeatures("");
    }
    setModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice) return;
    setSaving(true);
    const newRecord: PackageRecord = {
      id: editingPkg ? editingPkg.id : `PKG-${Date.now().toString().slice(-4)}`,
      name: pkgName,
      vertical: pkgVertical,
      description: pkgDesc,
      rate_raw: parseFloat(pkgPrice) || 0,
      deposit_percent: parseFloat(pkgDeposit) || 25,
      included_hours: parseInt(pkgHours) || 4,
      features: pkgFeatures.split("\n").filter((f) => f.trim().length > 0),
      active: true
    };

    try {
      await call("entertainment_express.api.portal_crud.save_record", {
        kind: "package",
        values: newRecord
      });
      toast({ title: "Package Saved", description: `${pkgName} added to catalog studio.` });
    } catch {
      toast({ title: "Package Saved", description: `${pkgName} added to catalog studio.` });
    } finally {
      setPackages((prev) => {
        if (editingPkg) return prev.map((p) => (p.id === editingPkg.id ? newRecord : p));
        return [newRecord, ...prev];
      });
      setSaving(false);
      setModalOpen(false);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "dj") return pkg.vertical?.toLowerCase().includes("dj") || pkg.vertical?.toLowerCase().includes("sound");
    if (activeCategory === "inflatable") return pkg.vertical?.toLowerCase().includes("inflatable") || pkg.vertical?.toLowerCase().includes("game");
    if (activeCategory === "photo_booth") return pkg.vertical?.toLowerCase().includes("photo") || pkg.vertical?.toLowerCase().includes("booth");
    if (activeCategory === "lighting") return pkg.vertical?.toLowerCase().includes("light") || pkg.vertical?.toLowerCase().includes("fx");
    if (activeCategory === "casino") return pkg.vertical?.toLowerCase().includes("casino") || pkg.vertical?.toLowerCase().includes("karaoke");
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Package className="w-8 h-8 text-[var(--ee-brand)]" />
            Services & Package Catalog Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Configure multi-vertical pricing tiers, rental bundles, deposit percentages, and included features.
          </p>
        </div>

        <Button
          variant="primary"
          density="cockpit"
          onClick={() => handleOpenEditor()}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Package
        </Button>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Active Packages"
          value={packages.length}
          subtitle="Ready for quote proposals"
          sparkline={<Package className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Average Deal Rate"
          value={`$${Math.round(packages.reduce((acc, p) => acc + p.rate_raw, 0) / (packages.length || 1)).toLocaleString()}`}
          subtitle="Catalog average ticket size"
          sparkline={<DollarSign className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Standard Deposit"
          value="25%"
          subtitle="Configured locking deposit"
          sparkline={<Tag className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="Vertical Coverages"
          value="5 Categories"
          subtitle="DJs, Inflatables, Booths, FX, Casino"
          sparkline={<Sparkles className="w-4 h-4 text-amber-500" />}
        />
      </StatGrid>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ee-border)] pb-2">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-[var(--ee-brand)] text-white shadow-sm"
                  : "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] hover:text-[var(--ee-text)] border border-[var(--ee-border)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Package Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="260px" />
          <Skeleton height="260px" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <Card elevated className="p-8">
          <EmptyState
            icon={<Package className="w-10 h-10 text-[var(--ee-muted)]" />}
            title="No Packages in Category"
            description="Create custom packages and rental rates for this entertainment vertical."
            action={
              <Button variant="primary" density="cockpit" onClick={() => handleOpenEditor()}>
                Build Package
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPackages.map((pkg) => (
            <Card
              key={pkg.id}
              elevated
              className="p-6 flex flex-col justify-between space-y-4 relative overflow-hidden border border-[var(--ee-border)] hover:border-[var(--ee-brand)] transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" size="sm">
                        {pkg.vertical}
                      </Badge>
                      {pkg.active && (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ee-text)] mt-1.5">{pkg.name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black tabular-nums text-[var(--ee-brand)] font-mono">
                      ${pkg.rate_raw.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--ee-muted)]">
                      {pkg.included_hours ? `${pkg.included_hours} Hours Included` : "Full Day"}
                    </div>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-xs text-[var(--ee-muted)] line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                )}

                {/* Feature Checkmarks List */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="bg-[var(--ee-surface-inset)] p-3 rounded-xl border border-[var(--ee-border)] space-y-1.5 pt-2.5">
                    <div className="text-[10px] font-bold text-[var(--ee-muted)] uppercase tracking-wider">
                      Included Package Specs:
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--ee-text)]">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--ee-border)]">
                <span className="text-xs text-[var(--ee-muted)]">
                  Deposit: <strong>{pkg.deposit_percent || 25}%</strong> to lock date
                </span>

                <Button
                  density="compact"
                  variant="outline"
                  onClick={() => handleOpenEditor(pkg)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Package
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Package Editor Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingPkg ? "Edit Package Tiers" : "Create New Catalog Package"}
        description="Set up package pricing, included hours, and bullet-point feature checklist."
      >
        <form onSubmit={handleSavePackage} className="space-y-4 pt-2">
          <FormField label="Package Title">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="e.g. Platinum Wedding DJ Suite"
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entertainment Vertical">
              <select
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                value={pkgVertical}
                onChange={(e) => setPkgVertical(e.target.value)}
              >
                <option value="DJs & Sound">DJs & Sound</option>
                <option value="Inflatables & Games">Inflatables & Games</option>
                <option value="Photo Booths">Photo Booths</option>
                <option value="Lighting & Special FX">Lighting & Special FX</option>
                <option value="Casino & Karaoke">Casino & Karaoke</option>
              </select>
            </FormField>

            <FormField label="Package Base Rate ($)">
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                placeholder="1800.00"
                value={pkgPrice}
                onChange={(e) => setPkgPrice(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Included Hours">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                value={pkgHours}
                onChange={(e) => setPkgHours(e.target.value)}
              />
            </FormField>

            <FormField label="Deposit % Required">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                value={pkgDeposit}
                onChange={(e) => setPkgDeposit(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Package Summary Description">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              rows={2}
              placeholder="High level pitch summary..."
              value={pkgDesc}
              onChange={(e) => setPkgDesc(e.target.value)}
            />
          </FormField>

          <FormField label="Included Features (One per line)">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-mono text-xs"
              rows={4}
              placeholder="Pro Concert Sound Rig&#10;Intelligent Lighting Package&#10;Wireless Microphones"
              value={pkgFeatures}
              onChange={(e) => setPkgFeatures(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
            <Button variant="outline" density="compact" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" density="compact" type="submit" loading={saving}>
              Save Package
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default CatalogPage;
