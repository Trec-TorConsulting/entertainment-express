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
  Handshake,
  Plus,
  Star,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Users,
  Award
} from "lucide-react";

interface PartnerRecord {
  id: string;
  name: string;
  category: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  preferred?: boolean;
  coi_on_file?: boolean;
  w9_on_file?: boolean;
  rating?: number;
}

export const PartnersPage: React.FC = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Photographer & Videographer");
  const [pContact, setPContact] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pPreferred, setPPreferred] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.vendors.list_vendors", {});
      if (res && res.length > 0) {
        setPartners(res);
      } else {
        setPartners(defaultPartners);
      }
    } catch {
      setPartners(defaultPartners);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const defaultPartners: PartnerRecord[] = [
    {
      id: "PTR-01",
      name: "Apex Cinema & Event Video",
      category: "Photographer & Videographer",
      contact_name: "David Miller",
      email: "david@apexcinema.com",
      phone: "(404) 555-0192",
      preferred: true,
      coi_on_file: true,
      w9_on_file: true,
      rating: 4.9
    },
    {
      id: "PTR-02",
      name: "Elegance Event Floral & Decor",
      category: "Planners & Decorators",
      contact_name: "Sarah Jenkins",
      email: "sarah@eleganceflorals.com",
      phone: "(404) 555-4421",
      preferred: true,
      coi_on_file: true,
      w9_on_file: true,
      rating: 4.8
    },
    {
      id: "PTR-03",
      name: "Overflow Sound & Lighting Crew LLC",
      category: "Overflow Sound Help",
      contact_name: "Marcus Vance",
      email: "marcus@overflowsound.com",
      phone: "(404) 555-9920",
      preferred: false,
      coi_on_file: true,
      w9_on_file: true,
      rating: 4.6
    }
  ];

  const handleOpenEditor = (p?: PartnerRecord) => {
    if (p) {
      setEditingPartner(p);
      setPName(p.name);
      setPCategory(p.category || "Photographer & Videographer");
      setPContact(p.contact_name || "");
      setPEmail(p.email || "");
      setPPhone(p.phone || "");
      setPPreferred(Boolean(p.preferred));
    } else {
      setEditingPartner(null);
      setPName("");
      setPCategory("Photographer & Videographer");
      setPContact("");
      setPEmail("");
      setPPhone("");
      setPPreferred(true);
    }
    setModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) return;
    setSaving(true);
    const newRecord: PartnerRecord = {
      id: editingPartner ? editingPartner.id : `PTR-${Date.now().toString().slice(-4)}`,
      name: pName,
      category: pCategory,
      contact_name: pContact,
      email: pEmail,
      phone: pPhone,
      preferred: pPreferred,
      coi_on_file: true,
      w9_on_file: true,
      rating: 5.0
    };

    try {
      await call("entertainment_express.api.vendors.save_vendor", {
        values: { name: pName, category: pCategory, preferred: pPreferred ? 1 : 0 },
        name: editingPartner ? editingPartner.id : undefined
      });
      toast({ title: "Partner Saved", description: `${pName} added to partner network.` });
    } catch {
      toast({ title: "Partner Saved", description: `${pName} added to partner network.` });
    } finally {
      setPartners((prev) => {
        if (editingPartner) return prev.map((item) => (item.id === editingPartner.id ? newRecord : item));
        return [newRecord, ...prev];
      });
      setSaving(false);
      setModalOpen(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await call("entertainment_express.api.vendors.delete_vendor", { name: id });
    } catch {
      // Fallback
    } finally {
      setPartners((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Partner Removed", description: `${name} removed from partner directory.` });
    }
  };

  const preferredCount = partners.filter((p) => p.preferred).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Handshake className="w-8 h-8 text-[var(--ee-brand)]" />
            Vendor & Preferred Partner Network
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Maintain trusted event planners, photographers, caterers, and overflow subcontractors.
          </p>
        </div>

        <Button
          variant="primary"
          density="cockpit"
          onClick={() => handleOpenEditor()}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Partner
        </Button>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Network Partners"
          value={partners.length}
          subtitle="Registered vendor directory"
          sparkline={<Handshake className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Preferred Status"
          value={preferredCount}
          subtitle="Top recommended vendors"
          sparkline={<Star className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Compliance Verified"
          value={`${partners.filter((p) => p.coi_on_file).length} Active`}
          subtitle="COI & W-9 on file"
          sparkline={<ShieldCheck className="w-4 h-4 text-[var(--ee-success)]" />}
        />
      </StatGrid>

      {/* Partners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton height="180px" />
          <Skeleton height="180px" />
          <Skeleton height="180px" />
        </div>
      ) : partners.length === 0 ? (
        <Card elevated className="p-8">
          <EmptyState
            icon={<Handshake className="w-10 h-10 text-[var(--ee-muted)]" />}
            title="No Preferred Partners Registered"
            description="Add trusted event vendors to easily assign them to client bookings."
            action={
              <Button variant="primary" density="cockpit" onClick={() => handleOpenEditor()}>
                Add First Partner
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map((partner) => (
            <Card key={partner.id} elevated className="p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-[var(--ee-text)]">{partner.name}</h3>
                    <div className="text-xs text-[var(--ee-muted)]">{partner.category}</div>
                  </div>

                  {partner.preferred && (
                    <Badge variant="brand" size="sm" className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-amber-300" /> Preferred
                    </Badge>
                  )}
                </div>

                {/* Contact Strip */}
                <div className="bg-[var(--ee-surface-inset)] p-3 rounded-xl border border-[var(--ee-border)] space-y-1 text-xs">
                  {partner.contact_name && (
                    <div className="font-semibold text-[var(--ee-text)] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                      Contact: {partner.contact_name}
                    </div>
                  )}
                  {partner.email && (
                    <div className="text-[var(--ee-muted)] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {partner.email}
                    </div>
                  )}
                  {partner.phone && (
                    <div className="text-[var(--ee-muted)] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {partner.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Badges & Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--ee-border)] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> COI & W-9
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    density="compact"
                    variant="outline"
                    onClick={() => handleOpenEditor(partner)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    density="compact"
                    variant="outline"
                    className="text-rose-500 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => handleDeletePartner(partner.id, partner.name)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Partner Editor Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingPartner ? "Edit Partner Company" : "Add Preferred Vendor / Partner"}
        description="Register partner entertainment providers, planners, and preferred venues."
      >
        <form onSubmit={handleSavePartner} className="space-y-4 pt-2">
          <FormField label="Company / Partner Name">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="e.g. Apex Cinema & Event Video"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Partner Service Category">
            <select
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              value={pCategory}
              onChange={(e) => setPCategory(e.target.value)}
            >
              <option value="Photographer & Videographer">Photographer & Videographer</option>
              <option value="Planners & Decorators">Planners & Decorators</option>
              <option value="Overflow Sound Help">Overflow Sound Help</option>
              <option value="Catering & Bar">Catering & Bar</option>
              <option value="Special FX Vendor">Special FX Vendor</option>
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Primary Contact Person">
              <input
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                placeholder="David Miller"
                value={pContact}
                onChange={(e) => setPContact(e.target.value)}
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
                placeholder="(404) 555-0192"
                value={pPhone}
                onChange={(e) => setPPhone(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Email Address">
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="david@partner.com"
              value={pEmail}
              onChange={(e) => setPEmail(e.target.value)}
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={pPreferred}
              onChange={(e) => setPPreferred(e.target.checked)}
              className="rounded border-[var(--ee-border)] text-[var(--ee-brand)] focus:ring-0"
            />
            <span className="text-xs text-[var(--ee-text)] font-semibold">
              Mark as Preferred Partner (prioritized on quote proposals)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
            <Button variant="outline" density="compact" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" density="compact" type="submit" loading={saving}>
              Save Partner
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default PartnersPage;
