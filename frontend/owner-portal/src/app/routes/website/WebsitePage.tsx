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
  Code
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
  const embedsTab = (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Code className="w-5 h-5 text-[var(--ee-brand)]" />
              Embed on WordPress, Squarespace, or Wix
            </CardTitle>
            <p className="text-xs text-[var(--ee-muted)] mt-1">
              Already have an existing website? Embed our live booking catalog and availability calendar with two lines of code.
            </p>
          </div>
          <Button
            variant="outline"
            density="compact"
            onClick={handleRotateEmbedKey}
            loading={rotatingKey}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Rotate Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[var(--ee-text)] mb-1">Your Site's Embed Snippet:</div>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                {embedSnippet || `<!-- Embed snippet for ${companyName} -->\n<script src="/assets/entertainment_express/embed.js" async></script>\n<div data-ee-widget="catalog" data-ee-key="${embedKey || "YOUR_KEY"}"></div>`}
              </pre>
              <Button
                variant="primary"
                density="compact"
                className="absolute top-3 right-3"
                onClick={handleCopySnippet}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Snippet
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
              <div className="text-xs font-bold text-[var(--ee-text)] mb-1">Catalog Widget</div>
              <code className="text-[11px] text-[var(--ee-brand)] font-mono">data-ee-widget="catalog"</code>
              <div className="text-[11px] text-[var(--ee-muted)] mt-1">Displays interactive package cards with price & instant quote buttons.</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
              <div className="text-xs font-bold text-[var(--ee-text)] mb-1">Date Availability</div>
              <code className="text-[11px] text-[var(--ee-brand)] font-mono">data-ee-widget="availability"</code>
              <div className="text-[11px] text-[var(--ee-muted)] mt-1">Allows prospective clients to check if their event date is open.</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
              <div className="text-xs font-bold text-[var(--ee-text)] mb-1">Reviews Badge</div>
              <code className="text-[11px] text-[var(--ee-brand)] font-mono">data-ee-widget="reviews"</code>
              <div className="text-[11px] text-[var(--ee-muted)] mt-1">Shows your 5-star rating badge linking to verified reviews.</div>
            </div>
          </div>
        </CardContent>
      </Card>
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
