import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Tabs,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatGrid,
  MetricCard,
  FormField,
  Input,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  useToast,
  call
} from "@portal-kit";
import {
  Globe,
  Sparkles,
  ExternalLink,
  Save,
  Check,
  Plus,
  FileText,
  Copy,
  RefreshCw,
  Eye,
  Tag,
  ShieldCheck,
  Layers,
  Code,
  Calendar,
  Star,
  Bookmark,
  MousePointerClick,
  Laptop,
  CheckCircle2,
  Users,
  UserCheck,
  Camera,
  MessageSquare,
  Share2,
  Trash2,
  Edit3,
  PlusCircle,
  Music,
  Mic,
  Palette
} from "lucide-react";
import { PageModal } from "./PageModal";

export const WebsitePage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "brand";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Brand Identity Settings
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [colorSecondary, setColorSecondary] = useState("#1e293b");
  const [colorAccent, setColorAccent] = useState("#f59e0b");
  const [colorBg, setColorBg] = useState("");
  const [colorText, setColorText] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [fontHeading, setFontHeading] = useState("Inter");
  const [fontBody, setFontBody] = useState("Inter");
  const [tagline, setTagline] = useState("");

  // Domain, SEO & Analytics Settings
  const [customDomain, setCustomDomain] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [gaMeasurementId, setGaMeasurementId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [customCss, setCustomCss] = useState("");

  // Homepage Settings
  const [companyName, setCompanyName] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("Book Your Event");
  const [heroCtaUrl, setHeroCtaUrl] = useState("/book");
  const [showPackages, setShowPackages] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [showEntertainers, setShowEntertainers] = useState(true);
  const [reviewUrl, setReviewUrl] = useState("");
  const [valueProps, setValueProps] = useState<any[]>([]);
  const [entertainers, setEntertainers] = useState<any[]>([]);
  const [packagesCount, setPackagesCount] = useState(0);

  // Custom Pages
  const [pages, setPages] = useState<any[]>([]);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Embeds
  const [embedKey, setEmbedKey] = useState("");
  const [embedSnippet, setEmbedSnippet] = useState("");
  const [rotatingKey, setRotatingKey] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<"catalog" | "availability" | "book" | "reviews" | "wishlist" | "entertainers">("catalog");
  const [previewDate, setPreviewDate] = useState("2026-10-24");
  const [previewBookLabel, setPreviewBookLabel] = useState("Book Your Event Now");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["brand", "homepage", "entertainers", "pages", "embeds", "seo_domain"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [configRes, pagesRes, embedRes, brandRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_website.get_website_config", {}),
        call("entertainment_express.api.embed.list_pages", {}),
        call("entertainment_express.api.embed.get_embed_settings", {}),
        call("entertainment_express.api.portal_owner.get_brand", {})
      ]);

      if (configRes.status === "fulfilled" && configRes.value) {
        const c = configRes.value;
        setCompanyName(c.company_name || "");
        setHeroHeadline(c.hero_headline || "");
        setHeroSubtitle(c.hero_subtitle || "");
        setHeroImage(c.hero_image || "");
        setHeroCtaText(c.hero_cta_text || "Book Your Event");
        setHeroCtaUrl(c.hero_cta_url || "/book");
        setShowPackages(c.show_packages === 1);
        setShowReviews(c.show_reviews === 1);
        setShowContact(c.show_contact === 1);
        setShowEntertainers(c.show_entertainers === 1);
        setReviewUrl(c.review_url || "");
        setValueProps(c.value_props || []);
        setEntertainers(c.entertainers || []);
        setPackagesCount(c.packages_count || 0);
      }

      if (brandRes.status === "fulfilled" && brandRes.value) {
        const b = brandRes.value;
        setBrandName(b.brand_name || "");
        if (b.brand_color) setBrandColor(b.brand_color);
        if (b.brand_color_secondary) setColorSecondary(b.brand_color_secondary);
        if (b.brand_color_accent) setColorAccent(b.brand_color_accent);
        if (b.brand_color_bg) setColorBg(b.brand_color_bg);
        if (b.brand_color_text) setColorText(b.brand_color_text);
        if (b.font_heading) setFontHeading(b.font_heading);
        if (b.font_body) setFontBody(b.font_body);
        setLogoUrl(b.brand_logo || "");
        setLogoDarkUrl(b.logo_dark || "");
        setFaviconUrl(b.brand_favicon || "");
        setOgImage(b.og_image || "");
        setTagline(b.footer_text || "");
        setCustomDomain(b.primary_custom_domain || "");
      }

      if (pagesRes.status === "fulfilled" && pagesRes.value) {
        setPages(pagesRes.value || []);
      }

      if (embedRes.status === "fulfilled" && embedRes.value) {
        setEmbedKey(embedRes.value.public_embed_key || "");
        setEmbedSnippet(embedRes.value.snippet || "");
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveHomepage = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.portal_website.save_website_config", {
        values: {
          hero_headline: heroHeadline,
          hero_subtitle: heroSubtitle,
          hero_image: heroImage,
          hero_cta_text: heroCtaText,
          hero_cta_url: heroCtaUrl,
          show_packages: showPackages ? 1 : 0,
          show_reviews: showReviews ? 1 : 0,
          show_contact: showContact ? 1 : 0,
          show_entertainers: showEntertainers ? 1 : 0,
          review_url: reviewUrl,
          value_props: valueProps,
          entertainers: entertainers
        }
      });
      toast({
        title: "Website Published",
        description: "Landing page messaging, section visibility, and entertainer bios have been updated.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Failed to Save",
        description: err.message || "An error occurred.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBrand = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.portal_owner.save_brand", {
        brand_name: brandName,
        brand_color: brandColor,
        brand_color_secondary: colorSecondary,
        brand_color_accent: colorAccent,
        brand_color_bg: colorBg,
        brand_color_text: colorText,
        font_heading: fontHeading,
        font_body: fontBody,
        brand_logo: logoUrl,
        logo_dark: logoDarkUrl,
        brand_favicon: faviconUrl,
        og_image: ogImage,
        footer_text: tagline,
      });
      document.documentElement.style.setProperty("--ee-brand", brandColor);
      toast({
        title: "Brand Identity Saved",
        description: "Visual identity, logo, colors, and typography updated across portal & client documents.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save brand settings.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeoDomain = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.api.portal_owner.save_brand", {
        primary_custom_domain: customDomain,
        og_image: ogImage,
      });
      toast({
        title: "Domain & SEO Published",
        description: "Custom hostname, OpenGraph social card, and tracking configuration saved.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save domain & SEO settings.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopySnippet = () => {
    if (embedSnippet) {
      navigator.clipboard.writeText(embedSnippet);
      toast({
        title: "Copied to Clipboard",
        description: "Embed snippet copied! Paste into your WordPress, Squarespace, or HTML site.",
        variant: "success"
      });
    }
  };

  const handleRotateEmbedKey = async () => {
    if (!confirm("Are you sure you want to rotate your public embed key? External sites with the old key will need to be updated.")) {
      return;
    }
    setRotatingKey(true);
    try {
      const res = await call("entertainment_express.api.embed.rotate_embed_key", {});
      if (res) {
        setEmbedKey(res.public_embed_key || "");
        setEmbedSnippet(res.snippet || "");
      }
      toast({
        title: "Embed Key Rotated",
        description: "A new secure public embed key has been generated.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Rotation Failed",
        description: err.message || "An error occurred.",
        variant: "danger"
      });
    } finally {
      setRotatingKey(false);
    }
  };

  const updateProp = (index: number, field: string, val: string) => {
    const updated = [...valueProps];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setValueProps(updated);
    }
  };

  const handleAddEntertainer = () => {
    const newEnt = {
      id: "ent-" + Date.now(),
      name: "New Performer",
      stage_name: "Stage / Artist Name",
      role: "Lead DJ / MC",
      photo_url: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=500&auto=format&fit=crop&q=80",
      bio: "Enter performer biography, experience, music style, and event background here...",
      specialties: ["Weddings", "Corporate Galas"],
      show_on_website: 1
    };
    setEntertainers([...entertainers, newEnt]);
    toast({
      title: "Entertainer Profile Drafted",
      description: "New performer profile added. Edit bio details and click 'Save Changes'.",
      variant: "success"
    });
  };

  const handleUpdateEntertainer = (id: string, field: string, value: any) => {
    setEntertainers(
      entertainers.map((ent) => (ent.id === id ? { ...ent, [field]: value } : ent))
    );
  };

  const handleDeleteEntertainer = (id: string) => {
    setEntertainers(entertainers.filter((ent) => ent.id !== id));
    toast({
      title: "Entertainer Removed",
      description: "Profile removed from roster.",
      variant: "neutral"
    });
  };

  const handleCopyChatCard = (ent: any) => {
    const specs = Array.isArray(ent.specialties) ? ent.specialties.join(", ") : ent.specialties || "";
    const text = `📸 ${ent.stage_name || ent.name} — ${ent.role}\nPhoto: ${ent.photo_url || "No image"}\nBio: ${ent.bio || ""}\nSpecialties: ${specs}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Chat Bio Card Copied!",
      description: "Entertainer photo & bio snippet copied to clipboard for client chats.",
      variant: "success"
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200 p-2 sm:p-0">
        <Skeleton width="260px" height="2.5rem" />
        <Skeleton height="100px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  // --- TAB 1: HOMEPAGE BUILDER ---
  const homepageTab = (
    <div className="space-y-6">
      {/* Live Preview Box */}
      <Card elevated className="border-2 border-[var(--ee-brand)]/20 bg-gradient-to-b from-[var(--ee-surface-inset)] to-[var(--ee-surface)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[var(--ee-border)]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--ee-brand)]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--ee-muted)]">
              Live Landing Page Hero Preview
            </CardTitle>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--ee-brand)] font-semibold flex items-center gap-1 hover:underline"
          >
            Open Live Site <ExternalLink className="w-3 h-3" />
          </a>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--ee-brand)]/10 text-[var(--ee-brand)] mb-4">
            ✨ Premier Live Event Production
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ee-text)] tracking-tight max-w-2xl mx-auto">
            {heroHeadline || `Live Entertainment with ${companyName}`}
          </h2>
          <p className="text-sm text-[var(--ee-muted)] mt-3 max-w-xl mx-auto leading-relaxed">
            {heroSubtitle || "World-class live entertainment and flawless production for weddings, corporate celebrations, and private events."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <span
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {heroCtaText || "Request a Quote"}
            </span>
            <span className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-[var(--ee-border)] bg-[var(--ee-surface)] text-[var(--ee-text)]">
              Browse Packages
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Hero Messaging Settings */}
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--ee-brand)]" />
            Hero Banner & Call-To-Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Main Headline *">
            <Input
              type="text"
              placeholder="e.g. Unforgettable Entertainment for Weddings & Events"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
            />
          </FormField>

          <FormField label="Hero Subtitle & Value Statement">
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
              placeholder="Describe your sound, talent, experience, and service promise..."
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Primary CTA Button Text">
              <Input
                type="text"
                placeholder="Request a Quote"
                value={heroCtaText}
                onChange={(e) => setHeroCtaText(e.target.value)}
              />
            </FormField>
            <FormField label="Primary Button Link URL">
              <Input
                type="text"
                placeholder="/request-quote or /book"
                value={heroCtaUrl}
                onChange={(e) => setHeroCtaUrl(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Hero Background Image URL (Optional)">
            <Input
              type="text"
              placeholder="https://... or upload in Brand identity"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Section Visibility Toggles */}
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--ee-brand)]" />
            Homepage Section Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[var(--ee-brand)]" />
                Featured Packages Grid
              </div>
              <div className="text-xs text-[var(--ee-muted)] mt-0.5">
                Displays published packages from your Catalog ({packagesCount} currently created)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPackages}
                onChange={(e) => setShowPackages(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--ee-brand)]" />
                Trust Badges & Reviews Highlight
              </div>
              <div className="text-xs text-[var(--ee-muted)] mt-0.5">
                Highlights 5.0 rating, on-time guarantee, and verified client testimonials
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showReviews}
                onChange={(e) => setShowReviews(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>

          {showReviews && (
            <div className="pl-4 border-l-2 border-[var(--ee-brand)]">
              <FormField label="External Reviews Link (Google / WeddingWire / TheKnot)">
                <Input
                  type="text"
                  placeholder="https://g.page/r/your-google-review-link"
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                />
              </FormField>
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--ee-brand)]" />
                Quick Quote Availability Form
              </div>
              <div className="text-xs text-[var(--ee-muted)] mt-0.5">
                Allows prospective clients to submit their date and event details directly from the homepage
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showContact}
                onChange={(e) => setShowContact(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--ee-brand)]" />
                "Meet Our Entertainers" Showcase Grid
              </div>
              <div className="text-xs text-[var(--ee-muted)] mt-0.5">
                Displays entertainer bios, stage photos, and specialty skill badges ({entertainers.filter(e => e.show_on_website).length} active)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showEntertainers}
                onChange={(e) => setShowEntertainers(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Value Propositions */}
      <Card elevated>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--ee-brand)]" />
            Highlight Badges (3 Key Selling Points)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {valueProps.map((vp, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-brand)]">
                  Highlight #{idx + 1}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Badge Title"
                  value={vp.title || ""}
                  onChange={(e) => updateProp(idx, "title", e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Short Description"
                  value={vp.description || ""}
                  onChange={(e) => updateProp(idx, "description", e.target.value)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // --- TAB 2: ENTERTAINERS & BIOS ---
  const entertainersTab = (
    <div className="space-y-6">
      {/* Overview & Global Visibility Toggle */}
      <Card elevated>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--ee-brand)]" />
              Public Entertainer Roster & Bios Studio
            </CardTitle>
            <p className="text-xs text-[var(--ee-muted)] mt-1">
              List your DJs, MCs, musicians, and performers with high-res bio photos, stage names, and specialties. Photos and bio snippets can be shared directly in client chats.
            </p>
          </div>
          <Button
            variant="primary"
            density="cockpit"
            onClick={handleAddEntertainer}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Entertainer Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--ee-brand)]" />
                Show "Meet Our Entertainers" Section on Website
              </div>
              <div className="text-xs text-[var(--ee-muted)] mt-0.5">
                Displays the public team roster on your landing page ({entertainers.filter((e) => e.show_on_website).length} active)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showEntertainers}
                onChange={(e) => setShowEntertainers(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Entertainer Bio Cards Editor List */}
      <div className="space-y-4">
        {entertainers.map((ent, idx) => (
          <Card key={ent.id || idx} elevated className="overflow-hidden border border-[var(--ee-border)]">
            <CardHeader className="bg-[var(--ee-surface-inset)]/50 py-3 border-b border-[var(--ee-border)] flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={ent.photo_url || "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=100&auto=format&fit=crop&q=80"}
                  alt={ent.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--ee-brand)] shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-[var(--ee-text)]">{ent.stage_name || ent.name || "Unnamed Performer"}</h4>
                  <p className="text-xs text-[var(--ee-muted)]">{ent.role || "Entertainer / Staff"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  density="compact"
                  onClick={() => handleCopyChatCard(ent)}
                  title="Copy Bio Pic & Summary for Client Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-[var(--ee-brand)]" />
                  Copy Chat Bio Card
                </Button>
                <Button
                  variant="danger"
                  density="compact"
                  onClick={() => handleDeleteEntertainer(ent.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Real / Full Name *">
                  <Input
                    type="text"
                    value={ent.name || ""}
                    placeholder="e.g. Marcus Vance"
                    onChange={(e) => handleUpdateEntertainer(ent.id, "name", e.target.value)}
                  />
                </FormField>
                <FormField label="Stage / Artist Name *">
                  <Input
                    type="text"
                    value={ent.stage_name || ""}
                    placeholder="e.g. DJ Marcus 'BeatDrop' Vance"
                    onChange={(e) => handleUpdateEntertainer(ent.id, "stage_name", e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Primary Role / Title *">
                  <Input
                    type="text"
                    value={ent.role || ""}
                    placeholder="e.g. Lead DJ & Master of Ceremonies"
                    onChange={(e) => handleUpdateEntertainer(ent.id, "role", e.target.value)}
                  />
                </FormField>
                <FormField label="High-Res Bio Photo URL *">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={ent.photo_url || ""}
                      placeholder="https://images.unsplash.com/..."
                      onChange={(e) => handleUpdateEntertainer(ent.id, "photo_url", e.target.value)}
                    />
                    {ent.photo_url && (
                      <a
                        href={ent.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded-md text-[var(--ee-brand)] hover:bg-[var(--ee-surface-inset)]"
                        title="View photo"
                      >
                        <Camera className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </FormField>
              </div>

              <FormField label="Public Bio & Profile Summary">
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                  placeholder="Describe experience, energy, performance style, crowd engagement, background..."
                  value={ent.bio || ""}
                  onChange={(e) => handleUpdateEntertainer(ent.id, "bio", e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <FormField label="Specialties & Key Skills (Comma separated)">
                  <Input
                    type="text"
                    value={Array.isArray(ent.specialties) ? ent.specialties.join(", ") : ent.specialties || ""}
                    placeholder="Weddings, Corporate Galas, Open Format, Bilingual MC"
                    onChange={(e) =>
                      handleUpdateEntertainer(
                        ent.id,
                        "specialties",
                        e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                      )
                    }
                  />
                </FormField>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-4">
                  <span className="text-xs text-[var(--ee-muted)] font-medium">Show on Website:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ent.show_on_website === 1 || ent.show_on_website === true}
                      onChange={(e) => handleUpdateEntertainer(ent.id, "show_on_website", e.target.checked ? 1 : 0)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Website Team Showcase Preview Box */}
      <Card elevated className="border-2 border-[var(--ee-brand)]/20 bg-gradient-to-b from-[var(--ee-surface-inset)] to-[var(--ee-surface)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[var(--ee-border)]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--ee-brand)]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--ee-muted)]">
              Live "Meet Our Entertainers" Website Section Preview
            </CardTitle>
          </div>
          <Badge variant="brand" size="sm">Client View Simulation</Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--ee-brand)]/10 text-[var(--ee-brand)] mb-2">
              ✨ World-Class Talent Roster
            </span>
            <h3 className="text-xl font-extrabold text-[var(--ee-text)]">Meet Your Entertainers</h3>
            <p className="text-xs text-[var(--ee-muted)] mt-1">
              Handcrafted performances, insured professionals, and unforgettable energy for your celebration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entertainers.filter((e) => e.show_on_website).map((ent, i) => (
              <div key={ent.id || i} className="bg-[var(--ee-surface)] rounded-xl border border-[var(--ee-border)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden relative bg-slate-200">
                  <img
                    src={ent.photo_url || "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=500&auto=format&fit=crop&q=80"}
                    alt={ent.stage_name || ent.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3.5">
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{ent.stage_name || ent.name}</h4>
                      <p className="text-xs text-amber-300 font-medium mt-0.5">{ent.role}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-[var(--ee-muted)] line-clamp-3 leading-relaxed">
                    {ent.bio}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(Array.isArray(ent.specialties) ? ent.specialties : []).slice(0, 3).map((spec: string, sIdx: number) => (
                      <span key={sIdx} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[var(--ee-brand)]/10 text-[var(--ee-brand)]">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // --- TAB 2: CUSTOM PAGES ---
  const pagesTab = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--ee-text)]">Standalone Marketing Pages</h3>
          <p className="text-xs text-[var(--ee-muted)]">
            Create public content pages like /p/about, /p/faq, or /p/terms with your brand header.
          </p>
        </div>
        <Button
          variant="primary"
          density="cockpit"
          onClick={() => {
            setSelectedPage(null);
            setPageModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Page
        </Button>
      </div>

      <Card elevated className="overflow-hidden">
        {pages.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FileText className="w-10 h-10 text-[var(--ee-muted)]" />}
              title="No Custom Pages Yet"
              description="Create your first standalone marketing page (e.g. /p/about or /p/services) to give clients more detailed information."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedPage(null);
                    setPageModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Your First Page
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--ee-border)]">
            {pages.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[var(--ee-surface-inset)] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--ee-text)]">{p.title}</span>
                    <Badge variant={p.published ? "success" : "neutral"} size="sm">
                      {p.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--ee-muted)] flex items-center gap-2">
                    <code>/p/{p.route}</code>
                    <span>•</span>
                    <span>Modified {p.modified ? p.modified.split(" ")[0] : "Recently"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/p/${p.route}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-xs font-semibold text-[var(--ee-muted)] hover:text-[var(--ee-brand)] flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    density="compact"
                    variant="outline"
                    onClick={() => {
                      setSelectedPage(p);
                      setPageModalOpen(true);
                    }}
                  >
                    Edit Page
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // --- TAB 3: EMBEDS & WIDGETS ---
  const handleCopySpecific = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
    toast({
      title: `${label} Copied!`,
      description: "Paste this HTML snippet into your WordPress, Squarespace, Wix, or Shopify site.",
      variant: "success",
    });
  };

  const widgetCatalogSnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="catalog" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`;
  const widgetAvailabilitySnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="availability" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`;
  const widgetBookSnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="book" data-ee-key="${embedKey || "YOUR_KEY"}" data-ee-label="${previewBookLabel}"></div>`;
  const widgetReviewsSnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="reviews" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`;
  const widgetWishlistSnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="wishlist" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`;
  const widgetEntertainersSnippet = `<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="entertainers" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`;

  const embedsTab = (
    <div className="space-y-8">
      {/* Overview Card */}
      <Card elevated>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Code className="w-5 h-5 text-[var(--ee-brand)]" />
              Embed Widgets on Any External Website
            </CardTitle>
            <p className="text-xs text-[var(--ee-muted)] mt-1">
              Already have a website on WordPress, Squarespace, Wix, or Shopify? Embed live booking calendars, package menus, entertainer roster bios, and review badges with two lines of code.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              density="compact"
              onClick={handleRotateEmbedKey}
              loading={rotatingKey}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Rotate Embed Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-[var(--ee-text)]">Your Public Embed Key: </span>
              <code className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[var(--ee-brand)] font-bold">
                {embedKey || "Loading..."}
              </code>
            </div>
            <span className="text-[var(--ee-muted)]">Site-scoped & isolated to your account</span>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Widget Previews & Code Generator */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[var(--ee-brand)]" />
              Interactive Widget Previews
            </h3>
            <p className="text-xs text-[var(--ee-muted)]">
              Choose a widget below to see an exact visual simulation of how it looks and behaves when embedded on an external page.
            </p>
          </div>
        </div>

        {/* Widget Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedWidget("catalog")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "catalog"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            1. Packages Catalog
          </button>
          <button
            type="button"
            onClick={() => setSelectedWidget("availability")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "availability"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            2. Date Availability
          </button>
          <button
            type="button"
            onClick={() => setSelectedWidget("book")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "book"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            3. Instant Booking Button
          </button>
          <button
            type="button"
            onClick={() => setSelectedWidget("reviews")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "reviews"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            4. Reviews Badge
          </button>
          <button
            type="button"
            onClick={() => setSelectedWidget("wishlist")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "wishlist"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            5. Saved Wishlist
          </button>
          <button
            type="button"
            onClick={() => setSelectedWidget("entertainers")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWidget === "entertainers"
                ? "bg-[var(--ee-brand)] text-white border-[var(--ee-brand)] shadow-sm"
                : "bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            6. Entertainers Roster
          </button>
        </div>

        {/* Selected Widget Live Preview & Snippet Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Simulation Frame */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center justify-between">
              <span>Visual Appearance on Client's External Site</span>
              <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Live Render Mode
              </span>
            </div>

            {/* Browser Mockup Wrapper */}
            <div className="rounded-xl border border-[var(--ee-border)] bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
              {/* Browser Mockup Header */}
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-[var(--ee-border)] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 max-w-xs mx-auto text-center">
                  <span className="px-3 py-0.5 rounded text-[11px] bg-white dark:bg-slate-800 text-slate-500 font-mono">
                    https://my-wordpress-site.com
                  </span>
                </div>
              </div>

              {/* Embedded Widget Live Sandbox */}
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30">
                {/* 1. CATALOG WIDGET PREVIEW */}
                {selectedWidget === "catalog" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 max-w-lg mx-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {companyName || "Our Entertainment Studio"} — Featured Packages
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Live real-time rates directly from your Catalog</p>
                      </div>
                      <Badge variant="brand" size="sm">Online Booking</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[var(--ee-brand)] transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Signature Celebration Package</div>
                          <div className="text-xs text-slate-500">Up to 4 hours sound & lighting, wireless mics, digital portal</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-[var(--ee-brand)]">$1,495</div>
                          <button
                            type="button"
                            className="mt-1 px-2.5 py-1 text-xs font-semibold rounded text-white shadow-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            Book now
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[var(--ee-brand)] transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">Premier Gala & Wedding Experience</div>
                          <div className="text-xs text-slate-500">Full-day production, dance lighting, custom monogram</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-[var(--ee-brand)]">$2,295</div>
                          <button
                            type="button"
                            className="mt-1 px-2.5 py-1 text-xs font-semibold rounded text-white shadow-xs"
                            style={{ backgroundColor: brandColor }}
                          >
                            Book now
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <a href="/book" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--ee-brand)] hover:underline flex items-center justify-center gap-1">
                        View Complete Catalog & Booking Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. AVAILABILITY WIDGET PREVIEW */}
                {selectedWidget === "availability" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--ee-brand)]" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Check Date Availability
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Select Your Proposed Event Date:
                        </label>
                        <input
                          type="date"
                          value={previewDate}
                          onChange={(e) => setPreviewDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-200">
                            Available — Open for Booking!
                          </div>
                          <div className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                            Our team currently has performers and sound equipment available on {previewDate}.
                          </div>
                        </div>
                      </div>

                      <a
                        href="/book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 text-center text-xs font-bold rounded-lg text-white shadow-sm transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        Reserve Your Date Online &rarr;
                      </a>
                    </div>
                  </div>
                )}

                {/* 3. INSTANT BOOKING BUTTON PREVIEW */}
                {selectedWidget === "book" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5 max-w-md mx-auto text-center">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Embedded Branded Call-To-Action Button
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Place this button anywhere on a pricing or landing page to route clients into your checkout flow.
                      </p>
                    </div>

                    <div className="py-4">
                      <a
                        href="/book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg text-white shadow-md transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Sparkles className="w-4 h-4" />
                        {previewBookLabel} &rarr;
                      </a>
                    </div>

                    <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Customize Button Label Preview:
                      </label>
                      <input
                        type="text"
                        value={previewBookLabel}
                        onChange={(e) => setPreviewBookLabel(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        placeholder="e.g. Reserve Your Experience"
                      />
                    </div>
                  </div>
                )}

                {/* 4. REVIEWS BADGE PREVIEW */}
                {selectedWidget === "reviews" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 max-w-sm mx-auto text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-400 text-lg">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>

                    <div>
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                        5.0 Star Rated Experience
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Verified Reviews on Google & WeddingWire
                      </div>
                    </div>

                    <div>
                      <a
                        href={reviewUrl || "/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ee-brand)] hover:underline"
                      >
                        Read all verified client feedback &rarr;
                      </a>
                    </div>
                  </div>
                )}

                {/* 5. WISHLIST WIDGET PREVIEW */}
                {selectedWidget === "wishlist" && (
                  <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-3 max-w-md mx-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-slate-100">
                        <Bookmark className="w-4 h-4 text-[var(--ee-brand)]" />
                        Saved Packages Wishlist (2 items)
                      </div>
                      <span className="text-[11px] text-slate-400">Stored locally in browser</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Signature Celebration Package</span>
                        <span className="font-bold text-[var(--ee-brand)]">$1,495</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Wireless Uplighting Expansion Bundle</span>
                        <span className="font-bold text-[var(--ee-brand)]">$350</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href="/request-quote"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 text-center text-xs font-bold rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        Request Quote for Saved Items &rarr;
                      </a>
                    </div>
                  </div>
                )}

                {/* 6. ENTERTAINERS ROSTER WIDGET PREVIEW */}
                {selectedWidget === "entertainers" && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 max-w-lg mx-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[var(--ee-brand)]" />
                          Featured Entertainers & Talent Roster
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Live roster widget embeddable on any external website</p>
                      </div>
                      <Badge variant="brand" size="sm">{entertainers.filter(e => e.show_on_website).length} Performers</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {entertainers.filter(e => e.show_on_website).slice(0, 2).map((ent, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                          <img
                            src={ent.photo_url || "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=300&auto=format&fit=crop&q=80"}
                            alt={ent.stage_name}
                            className="w-full h-24 object-cover"
                          />
                          <div className="p-2.5">
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{ent.stage_name || ent.name}</div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">{ent.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-1">
                      <a
                        href="/book"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block py-2 px-4 text-xs font-bold rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: brandColor }}
                      >
                        Inquire / Reserve Performer For Event &rarr;
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HTML Embed Snippet & Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)]">
              Embed Code Snippet
            </div>

            <Card elevated className="bg-slate-900 text-slate-100 border-slate-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedWidget === "catalog" && "Catalog Widget Snippet"}
                    {selectedWidget === "availability" && "Date Availability Snippet"}
                    {selectedWidget === "book" && "Instant Booking Button Snippet"}
                    {selectedWidget === "reviews" && "Reviews Badge Snippet"}
                    {selectedWidget === "wishlist" && "Client Wishlist Snippet"}
                    {selectedWidget === "entertainers" && "Entertainers Roster Snippet"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedWidget === "catalog") handleCopySpecific(widgetCatalogSnippet, "Catalog Snippet");
                      if (selectedWidget === "availability") handleCopySpecific(widgetAvailabilitySnippet, "Availability Snippet");
                      if (selectedWidget === "book") handleCopySpecific(widgetBookSnippet, "Booking Button Snippet");
                      if (selectedWidget === "reviews") handleCopySpecific(widgetReviewsSnippet, "Reviews Snippet");
                      if (selectedWidget === "wishlist") handleCopySpecific(widgetWishlistSnippet, "Wishlist Snippet");
                      if (selectedWidget === "entertainers") handleCopySpecific(widgetEntertainersSnippet, "Entertainers Roster Snippet");
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--ee-brand)] text-white hover:opacity-90 flex items-center gap-1 transition-all"
                  >
                    {copiedItem ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedItem ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                <pre className="text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto text-emerald-400">
                  {selectedWidget === "catalog" && widgetCatalogSnippet}
                  {selectedWidget === "availability" && widgetAvailabilitySnippet}
                  {selectedWidget === "book" && widgetBookSnippet}
                  {selectedWidget === "reviews" && widgetReviewsSnippet}
                  {selectedWidget === "wishlist" && widgetWishlistSnippet}
                  {selectedWidget === "entertainers" && widgetEntertainersSnippet}
                </pre>
              </CardContent>
            </Card>

            {/* Platform Integration Guide Cards */}
            <div className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-3">
              <div className="text-xs font-bold text-[var(--ee-text)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--ee-brand)]" />
                How to Paste on External Platforms:
              </div>
              <ul className="text-xs text-[var(--ee-muted)] space-y-2 pl-4 list-disc">
                <li>
                  <strong className="text-[var(--ee-text)]">WordPress / Elementor:</strong> Insert a <em>Custom HTML</em> block and paste the snippet directly into the block.
                </li>
                <li>
                  <strong className="text-[var(--ee-text)]">Squarespace:</strong> Add a <em>Code</em> block, ensure Mode is set to <em>HTML</em>, and paste the code.
                </li>
                <li>
                  <strong className="text-[var(--ee-text)]">Wix:</strong> Click <em>Add Elements (+) &rarr; Embed Code &rarr; Embed HTML</em> and paste the snippet.
                </li>
                <li>
                  <strong className="text-[var(--ee-text)]">Shopify / Webflow:</strong> Use a <em>Custom Liquid</em> or <em>Embed Element</em> anywhere on your product or landing page.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- TAB: BRAND & VISUAL IDENTITY ---
  const brandTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Brand Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[var(--ee-text)]">
                <Palette className="w-5 h-5 text-[var(--ee-brand)]" />
                Brand Styling & Palette Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Company Display Name" hint="Shown in browser title, navbar, quotes & invoices.">
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Apex Sound & Event Production"
                  density="cockpit"
                />
              </FormField>

              <FormField label="Brand Tagline or Slogan" hint="Displayed on invoice footers and proposal headers.">
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Unforgettable Music, Flawless Lighting & Event Excellence"
                  density="cockpit"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Primary Brand Color" hint="Primary buttons, active tabs & highlights.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor || "#0f766e"}
                      onChange={(e) => {
                        setBrandColor(e.target.value);
                        document.documentElement.style.setProperty("--ee-brand", e.target.value);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--ee-border)] p-1 bg-transparent"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => {
                        setBrandColor(e.target.value);
                        document.documentElement.style.setProperty("--ee-brand", e.target.value);
                      }}
                      placeholder="#0f766e"
                      density="cockpit"
                      className="font-mono"
                    />
                  </div>
                </FormField>

                <FormField label="Accent / Highlight Color" hint="Secondary badges, alert callouts & tags.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorAccent || "#f59e0b"}
                      onChange={(e) => setColorAccent(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--ee-border)] p-1 bg-transparent"
                    />
                    <Input
                      value={colorAccent}
                      onChange={(e) => setColorAccent(e.target.value)}
                      placeholder="#f59e0b"
                      density="cockpit"
                      className="font-mono"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Company Logo (Light Theme)" hint="Transparent PNG or vector SVG URL.">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.svg"
                    density="cockpit"
                  />
                </FormField>

                <FormField label="Company Favicon / App Icon" hint="16x16 or 32x32 .ico / .png URL.">
                  <Input
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.png"
                    density="cockpit"
                  />
                </FormField>
              </div>

              <FormField label="Typography Font Family" hint="Primary Google Font used for headers and landing pages.">
                <select
                  value={fontHeading}
                  onChange={(e) => setFontHeading(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                >
                  <option value="Inter">Inter (Clean Modern Sans-Serif)</option>
                  <option value="Outfit">Outfit (Bold Geometric Display)</option>
                  <option value="Montserrat">Montserrat (Classic Premium)</option>
                  <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                  <option value="Roboto">Roboto (Versatile Standard)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Sleek Tech)</option>
                </select>
              </FormField>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  density="cockpit"
                  onClick={handleSaveBrand}
                  loading={saving}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Save Brand Styling
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Interactive Theme Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
              Live Interactive Theme Preview
            </span>
            <Badge variant="brand" size="sm">CSS Variables Active</Badge>
          </div>

          <div
            className="rounded-2xl border border-[var(--ee-border)] shadow-xl overflow-hidden bg-[var(--ee-surface-base)]"
            style={{
              fontFamily: fontHeading !== "system" ? fontHeading : "inherit"
            }}
          >
            {/* Header Navbar Preview */}
            <div
              className="p-4 text-white flex items-center justify-between transition-colors duration-150"
              style={{ backgroundColor: brandColor || "#0f766e" }}
            >
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded bg-white/10 p-0.5" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                    {(brandName || "EE").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-sm tracking-tight">{brandName || "Entertainment Express"}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                Client Portal
              </span>
            </div>

            {/* Content Body Preview */}
            <div className="p-5 space-y-4 bg-[var(--ee-surface-raised)]">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-[var(--ee-text)]">
                    Annual Corporate Gala 2026
                  </h4>
                  <p className="text-xs text-[var(--ee-muted)] mt-0.5">
                    Proposal #PR-2026-88 • {tagline || "Live Sound & Production"}
                  </p>
                </div>
                <div
                  className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: colorAccent || "#f59e0b" }}
                >
                  Quote Ready
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ee-muted)]">Sound & DJ Package</span>
                  <span className="font-mono font-bold text-[var(--ee-text)]">$2,850.00</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ee-muted)]">Wireless Uplighting (12 Fixtures)</span>
                  <span className="font-mono font-bold text-[var(--ee-text)]">$650.00</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--ee-muted)]">Multi-tenant isolated</span>
                <span
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: brandColor || "#0f766e" }}
                >
                  Accept & Pay Deposit
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- TAB: DOMAIN, SEO & ANALYTICS ---
  const seoDomainTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Custom Domain CNAME */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[var(--ee-text)]">
                <Globe className="w-5 h-5 text-[var(--ee-brand)]" />
                Custom CNAME Domain Hostname
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Primary Custom Hostname"
                hint="Point a CNAME DNS record from your domain provider (GoDaddy, Namecheap, Cloudflare) to entx.app"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. booking.myentertainmentco.com"
                    density="cockpit"
                  />
                  <Badge variant={customDomain ? "success" : "neutral"} size="sm" className="shrink-0">
                    {customDomain ? "CNAME Active" : "Default entx.app"}
                  </Badge>
                </div>
              </FormField>

              <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs text-[var(--ee-muted)] space-y-1.5">
                <div className="font-semibold text-[var(--ee-text)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Automated TLS / SSL Certificate Provisioning
                </div>
                <p>
                  When you route your custom domain CNAME record to <code className="font-mono text-[var(--ee-brand)]">entx.app</code>, Traefik Gateway automatically issues an encrypted Let's Encrypt SSL certificate.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search Engine Optimization (SEO) & Social Previews */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[var(--ee-text)]">
                <Share2 className="w-5 h-5 text-[var(--ee-brand)]" />
                Search Engine Optimization (SEO) & Social Meta Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Meta Title Tag" hint="Appears in Google search results and browser tabs.">
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={companyName ? `${companyName} | Premier DJ & Event Production` : "Premier Live Music, Sound & DJ Production"}
                  density="cockpit"
                />
              </FormField>

              <FormField label="Meta Description" hint="Appears under search result links. Maximum 160 characters.">
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                  placeholder="Provide a compelling overview of your sound, lighting, photo booth, and DJ services for weddings, corporate events, and celebrations..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </FormField>

              <FormField label="Social Share Image URL (OpenGraph OG Image)" hint="Displayed when sharing your website URL on iMessage, WhatsApp, Facebook, or LinkedIn (1200x630 recommended).">
                <Input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200"
                  density="cockpit"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Analytics & Custom CSS */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[var(--ee-text)]">
                <Code className="w-5 h-5 text-[var(--ee-brand)]" />
                Tracking Pixels & Custom CSS Overrides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Google Analytics 4 ID" hint="GA4 Measurement ID (G-XXXXXXXXXX)">
                  <Input
                    value={gaMeasurementId}
                    onChange={(e) => setGaMeasurementId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    density="cockpit"
                  />
                </FormField>

                <FormField label="Meta / Facebook Pixel ID" hint="15-digit Facebook Pixel ID">
                  <Input
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="123456789012345"
                    density="cockpit"
                  />
                </FormField>
              </div>

              <FormField label="Custom CSS Overrides" hint="Additional custom CSS rules for white-label domains.">
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-[var(--ee-surface-inset)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                  placeholder="/* Custom CSS snippets */&#10;.public-hero-title { font-weight: 900; }"
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                />
              </FormField>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  density="cockpit"
                  onClick={handleSaveSeoDomain}
                  loading={saving}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Domain & SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Social OpenGraph Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
              Social Link Share Preview (iMessage / Meta)
            </span>
            <span className="text-xs text-[var(--ee-muted)]">OpenGraph Card</span>
          </div>

          <div className="rounded-2xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] shadow-xl overflow-hidden space-y-0">
            {ogImage ? (
              <img src={ogImage} alt="Social Share Preview" className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-gradient-to-br from-[var(--ee-brand)] to-purple-900 flex items-center justify-center p-6 text-center text-white">
                <div>
                  <Sparkles className="w-8 h-8 mx-auto opacity-80 mb-2" />
                  <div className="font-bold text-lg">{companyName || "Entertainment Express"}</div>
                  <div className="text-xs opacity-75 mt-0.5">{tagline || "Premier Event Production & Sound"}</div>
                </div>
              </div>
            )}
            <div className="p-4 space-y-1.5 bg-[var(--ee-surface-raised)] border-t border-[var(--ee-border)]">
              <div className="text-[11px] font-mono text-[var(--ee-brand)] uppercase tracking-wider font-semibold">
                {customDomain || "booking.entx.app"}
              </div>
              <h4 className="font-bold text-sm text-[var(--ee-text)] line-clamp-1">
                {seoTitle || (companyName ? `${companyName} | Premier DJ & Event Production` : "Premier Event Entertainment & Production")}
              </h4>
              <p className="text-xs text-[var(--ee-muted)] line-clamp-2">
                {seoDescription || "Book world-class live entertainment, sound, lighting, and photo booth production for your upcoming event."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Friendly Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2">
            <Globe className="w-8 h-8 text-[var(--ee-brand)]" />
            Website & Brand Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)]">
            Manage your visual brand identity, storefront landing page, performer roster, custom pages, embed widgets, and SEO domain settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-[var(--ee-muted)]" />
            View Live Site
          </a>
          <Button
            variant="primary"
            density="cockpit"
            onClick={activeTab === "brand" ? handleSaveBrand : activeTab === "seo_domain" ? handleSaveSeoDomain : handleSaveHomepage}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Brand Theme"
          value="Branded & Active"
          subtitle={brandName || "Company Palette"}
          sparkline={<Palette className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Landing Page"
          value="Live Storefront"
          subtitle="Public URL at /"
          sparkline={<Globe className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Entertainer Bios"
          value={entertainers.length}
          subtitle={`${entertainers.filter(e => e.show_on_website).length} visible on site`}
          sparkline={<Users className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Custom Hostname"
          value={customDomain ? "Custom CNAME" : "entx.app"}
          subtitle={customDomain || "SSL Encrypted"}
          sparkline={<ShieldCheck className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Workspace Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(tabId) => {
          setActiveTab(tabId);
          setSearchParams({ tab: tabId });
        }}
        tabs={[
          { id: "brand", label: "🎨 Brand & Visual Identity", content: brandTab },
          { id: "homepage", label: "🏠 Homepage & Hero Editor", content: homepageTab },
          { id: "entertainers", label: `🎧 Entertainers & Bios (${entertainers.length})`, content: entertainersTab },
          { id: "pages", label: `📄 Custom Pages (${pages.length})`, content: pagesTab },
          { id: "embeds", label: "🔌 Embeds & External Sites", content: embedsTab },
          { id: "seo_domain", label: "🌐 Domain, SEO & Analytics", content: seoDomainTab }
        ]}
      />

      {/* Custom Page Modal */}
      <PageModal
        open={pageModalOpen}
        onOpenChange={setPageModalOpen}
        page={selectedPage}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default WebsitePage;
