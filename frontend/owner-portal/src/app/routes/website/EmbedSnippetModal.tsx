import React, { useState } from "react";
import {
  Button,
  Dialog,
  FormField,
  Badge,
  useToast
} from "@portal-kit";
import { Code, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";

interface EmbedSnippetModalProps {
  open: boolean;
  onClose: () => void;
  apiKey?: string;
}

export const EmbedSnippetModal: React.FC<EmbedSnippetModalProps> = ({
  open,
  onClose,
  apiKey = "pk_live_9941a8b2c0194e82"
}) => {
  const { toast } = useToast();
  const [widgetType, setWidgetType] = useState<"availability" | "catalog" | "wishlist" | "booking">("availability");
  const [themeColor, setThemeColor] = useState("#0f766e");
  const [copied, setCopied] = useState(false);

  const snippet = `<!-- Entertainment Express Embeddable Widget -->
<script src="https://entx.app/assets/entx-widgets.js" async></script>
<div 
  data-entx-widget="${widgetType}" 
  data-api-key="${apiKey}"
  data-theme-color="${themeColor}">
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast({
      title: "Embed Code Copied",
      description: "Paste snippet into Squarespace, WordPress, Wix, or Shopify."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title="Embed Widget Snippet Generator"
      description="Copy standalone JavaScript snippet to render live availability checkers and catalogs on external websites."
    >
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Widget Type">
            <select
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-semibold"
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as any)}
            >
              <option value="availability">Availability Checker (Date Picker)</option>
              <option value="catalog">Interactive Equipment Catalog</option>
              <option value="wishlist">Quote Wishlist Builder</option>
              <option value="booking">Instant Deposit Booking Checkout</option>
            </select>
          </FormField>

          <FormField label="Widget Accent Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded border border-[var(--ee-border)] cursor-pointer"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
              />
              <span className="font-mono text-xs text-[var(--ee-text)] font-bold">{themeColor}</span>
            </div>
          </FormField>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--ee-text)] flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> Standard HTML Snippet:
            </span>
            <Badge variant="brand" size="sm">
              <ShieldCheck className="w-3 h-3 mr-1" /> Shadow DOM Isolated
            </Badge>
          </div>

          <pre className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs font-mono text-[var(--ee-text)] overflow-x-auto">
            {snippet}
          </pre>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[var(--ee-border)]">
          <span className="text-xs text-[var(--ee-muted)]">
            Restricted to whitelisted domains on key <strong className="font-mono">{apiKey.slice(0, 12)}...</strong>
          </span>

          <div className="flex gap-2">
            <Button variant="outline" density="compact" onClick={onClose}>
              Done
            </Button>
            <Button variant="primary" density="compact" onClick={handleCopy} leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
              {copied ? "Copied Snippet!" : "Copy Code"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
