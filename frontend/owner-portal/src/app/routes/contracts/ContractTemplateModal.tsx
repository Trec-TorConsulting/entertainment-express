import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Check } from "lucide-react";
import { RichContractEditor } from "./RichContractEditor";

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
          `<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">PERFORMANCE & SERVICE AGREEMENT</h2>\n  <p>This Binding Agreement is entered into between <strong>{{ owner.company_name }}</strong> ("Provider") and <strong>{{ doc.signer_name }}</strong> ("Client").</p>\n  <h3>1. Scope of Services & Equipment</h3>\n  <p>Provider agrees to perform professional entertainment services for the event on <strong>{{ doc.event_date }}</strong> at <strong>{{ doc.venue_address }}</strong>.</p>\n  <h3>2. Compensation & Payment Schedule</h3>\n  <p>Total Contract Price: <strong>{{ doc.grand_total }}</strong>.<br/>A non-refundable deposit of <strong>{{ doc.deposit_amount }}</strong> is required upon signature.</p>\n  <h3>3. Terms & Cancellation Policy</h3>\n  <p>In the event of cancellation by Client within 14 days of the event, deposit shall be forfeited.</p>\n  <br/>\n  <p style="font-style: italic;">By typing your name below, you agree to all terms and conditions outlined in this binding contract.</p>\n</div>`
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
      const payload: any = {
        values: {
          template_name: templateName,
          active: active ? 1 : 0,
          body: body
        }
      };
      if (template?.name) {
        payload.name = template.name;
      }
      await call("entertainment_express.api.contract.save_template", payload);

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
      className="max-w-4xl max-h-[92vh] overflow-y-auto"
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

        <FormField label="Template Body (WYSIWYG & Visual Formatting Studio)">
          <RichContractEditor
            value={body}
            onChange={setBody}
            height="h-[480px]"
          />
        </FormField>

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
