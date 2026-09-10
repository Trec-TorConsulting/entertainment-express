import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Button,
  useToast,
  call
} from "@portal-kit";
import { FileText, Globe, Check } from "lucide-react";

export interface PageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: any;
  onSuccess?: () => void;
}

export const PageModal: React.FC<PageModalProps> = ({
  open,
  onOpenChange,
  page,
  onSuccess
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [route, setRoute] = useState("");
  const [published, setPublished] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (page) {
        setTitle(page.title || "");
        setRoute(page.route || "");
        setPublished(page.published === 1 || page.published === true);
        setSeoTitle(page.seo_title || "");
        setSeoDescription(page.seo_description || "");
        // If full body isn't in summary row, fetch it
        if (page.id) {
          call("entertainment_express.api.embed.get_page", { name: page.id })
            .then((res: any) => {
              if (res) {
                setBody(res.body || "");
                setSeoDescription(res.seo_description || "");
              }
            })
            .catch(() => {});
        }
      } else {
        setTitle("");
        setRoute("");
        setPublished(true);
        setSeoTitle("");
        setSeoDescription("");
        setBody("<p>Welcome to our page. Add your content here.</p>");
      }
    }
  }, [open, page]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!page && !route) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setRoute(slug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "danger" });
      return;
    }
    if (!route.trim()) {
      toast({ title: "Route slug is required", variant: "danger" });
      return;
    }

    setSaving(true);
    try {
      await call("entertainment_express.api.embed.save_page", {
        values: {
          title,
          route: route.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          published: published ? 1 : 0,
          seo_title: seoTitle,
          seo_description: seoDescription,
          body
        },
        name: page?.id
      });
      toast({
        title: page ? "Page Updated" : "Page Created",
        description: `Successfully saved /p/${route}`,
        variant: "success"
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to Save Page",
        description: err.message || "An error occurred.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={page ? `Edit Page: /p/${page.route}` : "Create Custom Marketing Page"}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Page Title *">
            <Input
              type="text"
              placeholder="e.g. About Our Entertainment Team"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </FormField>
          <FormField label="URL Slug * (/p/...)">
            <div className="flex items-center">
              <span className="text-xs text-[var(--ee-muted)] px-2 py-2 bg-[var(--ee-surface-inset)] border border-r-0 border-[var(--ee-border)] rounded-l-md">
                /p/
              </span>
              <Input
                type="text"
                placeholder="about"
                className="rounded-l-none"
                value={route}
                onChange={(e) => setRoute(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
              />
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="SEO Title (Optional)">
            <Input
              type="text"
              placeholder="Title shown in browser tab"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </FormField>
          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] mt-6">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)]">Published Status</div>
              <div className="text-xs text-[var(--ee-muted)]">Make publicly accessible at /p/{route || "..."}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>
        </div>

        <FormField label="SEO Meta Description">
          <Input
            type="text"
            placeholder="Brief summary for Google search results"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </FormField>

        <FormField label="Page Content (HTML or formatted text)">
          <textarea
            rows={8}
            className="w-full px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<p>Write your page text, headings, or embedded videos here...</p>"
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--ee-border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
          >
            <Check className="w-4 h-4 mr-1.5" />
            {page ? "Save Page Changes" : "Create Page"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
