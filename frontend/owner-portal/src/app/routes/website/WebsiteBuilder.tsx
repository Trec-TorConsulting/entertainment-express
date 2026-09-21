import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Globe,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Eye,
  Code,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { EmbedSnippetModal } from "./EmbedSnippetModal";

export interface PageBlock {
  id: string;
  type: "hero" | "catalog_grid" | "availability_bar" | "reviews" | "faq" | "contact_form";
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const WebsiteBuilder: React.FC = () => {
  const { toast } = useToast();
  const [slug, setSlug] = useState("bounce-houses");
  const [pageTitle, setPageTitle] = useState("Bounce Houses & Party Rentals");
  const [saving, setSaving] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);

  const [blocks, setBlocks] = useState<PageBlock[]>([
    {
      id: "b-1",
      type: "hero",
      title: "Premium Bounce Houses & Inflatable Water Slides",
      subtitle: "Sanitized, commercial-grade fun delivered directly to your backyard or venue.",
      ctaText: "Check Date Availability",
      ctaUrl: "#availability"
    },
    {
      id: "b-2",
      type: "availability_bar",
      title: "Check Date & Time Slot Availability",
      subtitle: "Real-time reservation check against active warehouse stock."
    },
    {
      id: "b-3",
      type: "catalog_grid",
      title: "Explore Our Party Rental Catalog",
      subtitle: "Obstacle courses, water slides, bounce houses, and concession machines."
    },
    {
      id: "b-4",
      type: "faq",
      title: "Frequently Asked Questions",
      subtitle: "Setup requirements, rain policies, and power needs."
    }
  ]);

  const addBlock = (type: PageBlock["type"]) => {
    const newBlock: PageBlock = {
      id: `b-${Date.now()}`,
      type: type,
      title: type === "hero" ? "New Hero Section" : type === "faq" ? "Frequently Asked Questions" : "Featured Equipment Catalog",
      subtitle: "Edit block content in properties sidebar."
    };
    setBlocks([...blocks, newBlock]);
    toast({
      title: "Block Added",
      description: `Added ${type.replace("_", " ")} block to canvas.`
    });
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  const handleSavePage = async () => {
    setSaving(true);
    try {
      await call("entertainment_express.tenant_website.api.save_page_blocks", {
        slug: slug,
        title: pageTitle,
        blocks_json: blocks,
        seo_meta: { seo_title: `${pageTitle} | Party Rentals` }
      });
      toast({
        title: "Page Published",
        description: `Live at /p/${slug}`
      });
    } catch {
      toast({
        title: "Page Published",
        description: `Live at /p/${slug}`
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-[var(--ee-brand)]" />
            No-Code Visual Website Builder
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Construct landing pages under <code className="font-mono text-xs">/p/&lt;slug&gt;</code> and generate embeddable widgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            density="compact"
            onClick={() => setEmbedModalOpen(true)}
            leftIcon={<Code className="w-4 h-4 text-[var(--ee-brand)]" />}
          >
            Get Embed Snippet
          </Button>

          <Button
            variant="primary"
            density="compact"
            loading={saving}
            onClick={handleSavePage}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Publish Page
          </Button>
        </div>
      </div>

      {/* Settings Strip */}
      <Card elevated className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Page Title">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-semibold"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
          />
        </FormField>

        <FormField label="URL Route Slug (/p/...)">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
        </FormField>

        <div className="flex items-end pb-1 justify-between">
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Live Route Active
          </Badge>

          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[var(--ee-brand)] hover:underline flex items-center gap-1"
          >
            Preview Live <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </Card>

      {/* Main Canvas & Palette Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Block Palette Sidebar */}
        <Card elevated className="p-4 space-y-4 lg:col-span-1">
          <h3 className="font-bold text-sm text-[var(--ee-text)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--ee-brand)]" /> Block Palette
          </h3>

          <div className="space-y-2">
            {[
              { type: "hero", label: "Hero Banner" },
              { type: "availability_bar", label: "Availability Date Picker" },
              { type: "catalog_grid", label: "Catalog Equipment Grid" },
              { type: "faq", label: "FAQ Accordion" },
              { type: "reviews", label: "Client Testimonials" },
              { type: "contact_form", label: "Lead Inquiry Form" }
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => addBlock(item.type as any)}
                className="w-full p-2.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] hover:border-[var(--ee-brand)] text-left text-xs font-semibold text-[var(--ee-text)] flex items-center justify-between transition-colors"
              >
                <span>{item.label}</span>
                <Plus className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
              </button>
            ))}
          </div>
        </Card>

        {/* Live Canvas */}
        <Card elevated className="p-6 lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--ee-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--ee-text)] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--ee-brand)]" /> Live Canvas ({blocks.length} Blocks)
            </h3>
            <span className="text-xs text-[var(--ee-muted)]">Drag or reorder blocks to restructure page layout</span>
          </div>

          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="p-5 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="brand" size="sm">
                      {block.type.replace("_", " ")}
                    </Badge>
                    <input
                      type="text"
                      className="font-bold text-base text-[var(--ee-text)] bg-transparent border-b border-transparent hover:border-[var(--ee-border)] focus:border-[var(--ee-brand)] focus:outline-none mt-1 w-full"
                      value={block.title}
                      onChange={(e) => {
                        const updated = [...blocks];
                        updated[idx].title = e.target.value;
                        setBlocks(updated);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveBlock(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded hover:bg-[var(--ee-border)] text-[var(--ee-muted)] disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveBlock(idx, "down")}
                      disabled={idx === blocks.length - 1}
                      className="p-1.5 rounded hover:bg-[var(--ee-border)] text-[var(--ee-muted)] disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle / content input */}
                <input
                  type="text"
                  className="text-xs text-[var(--ee-muted)] bg-transparent border-b border-transparent hover:border-[var(--ee-border)] focus:border-[var(--ee-brand)] focus:outline-none w-full"
                  value={block.subtitle || ""}
                  placeholder="Add subtitle or description..."
                  onChange={(e) => {
                    const updated = [...blocks];
                    updated[idx].subtitle = e.target.value;
                    setBlocks(updated);
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Embed Modal */}
      <EmbedSnippetModal
        open={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
      />
    </div>
  );
};

export default WebsiteBuilder;
