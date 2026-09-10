import React, { useEffect, useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { PageModal } from "./PageModal";

export const WebsitePage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("homepage");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Homepage Settings
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("Book Your Event");
  const [heroCtaUrl, setHeroCtaUrl] = useState("/book");
  const [showPackages, setShowPackages] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [reviewUrl, setReviewUrl] = useState("");
  const [valueProps, setValueProps] = useState<any[]>([]);
  const [packagesCount, setPackagesCount] = useState(0);

  // Custom Pages
  const [pages, setPages] = useState<any[]>([]);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Embeds
  const [embedKey, setEmbedKey] = useState("");
  const [embedSnippet, setEmbedSnippet] = useState("");
  const [rotatingKey, setRotatingKey] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<"catalog" | "availability" | "book" | "reviews" | "wishlist">("catalog");
  const [previewDate, setPreviewDate] = useState("2026-10-24");
  const [previewBookLabel, setPreviewBookLabel] = useState("Book Your Event Now");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [configRes, pagesRes, embedRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_website.get_website_config", {}),
        call("entertainment_express.api.embed.list_pages", {}),
        call("entertainment_express.api.embed.get_embed_settings", {})
      ]);

      if (configRes.status === "fulfilled" && configRes.value) {
        const c = configRes.value;
        setCompanyName(c.company_name || "");
        setBrandColor(c.brand_color || "#0f766e");
        setHeroHeadline(c.hero_headline || "");
        setHeroSubtitle(c.hero_subtitle || "");
        setHeroImage(c.hero_image || "");
        setHeroCtaText(c.hero_cta_text || "Book Your Event");
        setHeroCtaUrl(c.hero_cta_url || "/book");
        setShowPackages(c.show_packages === 1);
        setShowReviews(c.show_reviews === 1);
        setShowContact(c.show_contact === 1);
        setReviewUrl(c.review_url || "");
        setValueProps(c.value_props || []);
        setPackagesCount(c.packages_count || 0);
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
          review_url: reviewUrl,
          value_props: valueProps
        }
      });
      toast({
        title: "Website Published",
        description: "Landing page messaging and section visibility have been updated.",
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
              Already have a website on WordPress, Squarespace, Wix, or Shopify? Embed live booking calendars, package menus, and review badges with two lines of code.
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
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedWidget === "catalog") handleCopySpecific(widgetCatalogSnippet, "Catalog Snippet");
                      if (selectedWidget === "availability") handleCopySpecific(widgetAvailabilitySnippet, "Availability Snippet");
                      if (selectedWidget === "book") handleCopySpecific(widgetBookSnippet, "Booking Button Snippet");
                      if (selectedWidget === "reviews") handleCopySpecific(widgetReviewsSnippet, "Reviews Snippet");
                      if (selectedWidget === "wishlist") handleCopySpecific(widgetWishlistSnippet, "Wishlist Snippet");
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      {/* Friendly Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)]">
            Website Builder & Storefront
          </h1>
          <p className="text-base text-[var(--ee-muted)]">
            Customize your live customer landing page, manage standalone pages, and embed widgets.
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
            onClick={handleSaveHomepage}
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
          title="Landing Page"
          value="Live & Branded"
          subtitle="Public URL at /"
          sparkline={<Globe className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Packages Displayed"
          value={packagesCount}
          subtitle="From Catalog items"
          sparkline={<Tag className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Custom Pages"
          value={pages.length}
          subtitle="Standalone /p/* pages"
          sparkline={<FileText className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="Embed Widgets"
          value="Enabled"
          subtitle="Cross-domain active"
          sparkline={<Code className="w-4 h-4 text-emerald-500" />}
        />
      </StatGrid>

      {/* Workspace Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "homepage", label: "Homepage & Hero Editor", content: homepageTab },
          { id: "pages", label: `Custom Pages (${pages.length})`, content: pagesTab },
          { id: "embeds", label: "Embeds & External Sites", content: embedsTab }
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
