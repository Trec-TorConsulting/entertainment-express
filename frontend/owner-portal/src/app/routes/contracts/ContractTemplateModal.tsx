import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Check, AlertCircle } from "lucide-react";

export interface ContractTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null;
  onSuccess?: () => void;
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({
  open,
  onOpenChange,
  template,
  onSuccess
}) => {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("");
  const [active, setActive] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setTemplateName(template.template_name || "");
        setActive(template.active === 1 || template.active === true);
        setBody(template.body || "");
      } else {
        setTemplateName("");
        setActive(true);
        setBody(
          `<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px;">\n  <h2>AGREEMENT TITLE</h2>\n  <p>This contract is between {{ company_name }} and {{ customer_name }}.</p>\n  <p>Event Date: {{ event_date }}</p>\n  <p>Grand Total: {{ grand_total }} | Deposit: {{ deposit_amount }}</p>\n  <h3>Terms & Conditions</h3>\n  <p>1. Performance details and cancellation rules...</p>\n</div>`
        );
      }
    }
  }, [open, template]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toast({ title: "Template name is required", variant: "danger" });
      return;
    }

    setSaving(true);
    try {
      await call("entertainment_express.api.contract.save_template", {
        name: template?.name,
        values: {
          template_name: templateName,
          active: active ? 1 : 0,
          body: body
        }
      });

      toast({
        title: template ? "Template Updated" : "Template Created",
        description: `Saved '${templateName}' template.`,
        variant: "success"
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to Save Template",
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
      title={template ? `Edit Template: ${template.template_name}` : "Create Contract & Agreement Template"}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Template Title *">
            <Input
              type="text"
              placeholder="e.g. Standard DJ Performance Agreement"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
          </FormField>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <div>
              <div className="text-sm font-semibold text-[var(--ee-text)]">Active Status</div>
              <div className="text-xs text-[var(--ee-muted)]">Available for contract generation</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)]"></div>
            </label>
          </div>
        </div>

        <FormField label="Template Body (Jinja2 / HTML)">
          <textarea
            rows={10}
            className="w-full px-3 py-2 text-sm font-mono border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<p>Insert template HTML here...</p>"
          />
        </FormField>

        {/* Jinja Helper */}
        <div className="p-3 bg-[var(--ee-surface-inset)] rounded-lg border border-[var(--ee-border)] space-y-1">
          <div className="text-xs font-bold text-[var(--ee-text)] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> Available Template Placeholders:
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["{{ customer_name }}", "{{ company_name }}", "{{ event_date }}", "{{ venue_address }}", "{{ grand_total }}", "{{ deposit_amount }}"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBody((prev) => prev + " " + v)}
                className="px-2 py-0.5 rounded bg-[var(--ee-panel)] border border-[var(--ee-border)] font-mono text-[11px] text-[var(--ee-text)] hover:border-[var(--ee-brand)]"
              >
                + {v}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
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
            {template ? "Save Template Changes" : "Create Template"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
