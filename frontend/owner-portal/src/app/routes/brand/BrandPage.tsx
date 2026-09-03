import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  FormField,
  useToast,
  Skeleton,
  call
} from "@portal-kit";
import {
  Palette, Sparkles, Check, Globe, RefreshCw, Eye
} from "lucide-react";

export const BrandPage: React.FC = () => {
  const { toast } = useToast();

  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [colorAccent, setColorAccent] = useState("#f59e0b");
  const [logoUrl, setLogoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    call("entertainment_express.api.portal_owner.get_brand", {})
      .then((doc) => {
        if (doc) {
          setBrandName(doc.brand_name || "");
          if (doc.brand_color) setBrandColor(doc.brand_color);
          if (doc.brand_color_accent) setColorAccent(doc.brand_color_accent);
          setLogoUrl(doc.brand_logo || "");
          setTagline(doc.footer_text || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleColorChange = (newColor: string) => {
    setBrandColor(newColor);
    // Live update CSS variable on document for instantaneous preview
    document.documentElement.style.setProperty("--ee-brand", newColor);
  };

  const handleAccentChange = (newAccent: string) => {
    setColorAccent(newAccent);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.portal_owner.save_brand", {
        brand_name: brandName,
        brand_color: brandColor,
        brand_color_accent: colorAccent,
        brand_logo: logoUrl,
        footer_text: tagline,
      });
      toast({
        title: "Brand Identity Saved",
        description: "Your portal and customer quote styling has been updated across all public pages.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to save brand",
        description: err.message || "An error occurred.",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="3rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton height="20rem" />
          <Skeleton height="20rem" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Brand Identity & Appearance"
        subtitle="Configure the visual identity for your owner dashboard, talent app, client booking portal, and automated proposals."
        actions={
          <Button
            variant="primary"
            density="cockpit"
            onClick={handleSave}
            loading={saving}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Save Brand Settings
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Brand Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--ee-brand)]" />
                Brand Styling Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Company Display Name" hint="Shown in browser title, navigation bar, and email signatures.">
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Apex Sound & Light"
                  density="cockpit"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Primary Brand Color" hint="Primary buttons, active rail tabs, highlight accents.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--ee-border)] p-1 bg-transparent"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#0f766e"
                      density="cockpit"
                      className="font-mono"
                    />
                  </div>
                </FormField>

                <FormField label="Accent / Warning Color" hint="Secondary badges, highlight tags, alert states.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorAccent}
                      onChange={(e) => handleAccentChange(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--ee-border)] p-1 bg-transparent"
                    />
                    <Input
                      value={colorAccent}
                      onChange={(e) => handleAccentChange(e.target.value)}
                      placeholder="#f59e0b"
                      density="cockpit"
                      className="font-mono"
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Company Logo URL" hint="Vector SVG or transparent PNG URL.">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.svg"
                  density="cockpit"
                />
              </FormField>

              <FormField label="Portal Tagline or Footer" hint="Displayed on invoices and quotes.">
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Sound, Lighting & Event Production Excellence"
                  density="cockpit"
                />
              </FormField>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live CSS-Var Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Interactive Preview
            </span>
            <span className="text-xs text-[var(--ee-muted)]">Instant React Preview</span>
          </div>

          <div
            className="rounded-2xl border border-[var(--ee-border)] shadow-lg overflow-hidden bg-[var(--ee-surface-base)]"
            style={{
              ["--preview-brand" as any]: brandColor,
              ["--preview-accent" as any]: colorAccent
            }}
          >
            {/* Mock Header */}
            <div
              className="p-4 text-white flex items-center justify-between transition-colors duration-150"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                    {(brandName || "EE").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-sm tracking-tight">{brandName || "Entertainment Express"}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                Client Portal
              </span>
            </div>

            {/* Mock Content */}
            <div className="p-5 space-y-4 bg-[var(--ee-surface-raised)]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-[var(--ee-text)]">
                    Summer Gala Production
                  </h4>
                  <p className="text-xs text-[var(--ee-muted)] mt-0.5">
                    Proposal #PR-2026-09
                  </p>
                </div>
                <div
                  className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: colorAccent }}
                >
                  Action Required
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--ee-muted)]">Event Package:</span>
                  <span className="font-semibold text-[var(--ee-text)]">Concert Rig + Lighting</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ee-muted)]">Deposit Due:</span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: brandColor }}
                  >
                    $1,250.00
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 px-3 rounded-lg font-semibold text-xs text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                >
                  Accept & Sign Contract
                </button>
                <button
                  type="button"
                  className="py-2 px-3 rounded-lg font-semibold text-xs border border-[var(--ee-border)] bg-[var(--ee-surface-base)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)]"
                >
                  Decline
                </button>
              </div>

              {tagline && (
                <p className="text-center text-[10px] text-[var(--ee-muted)] pt-2 border-t border-[var(--ee-border-subtle)]">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
