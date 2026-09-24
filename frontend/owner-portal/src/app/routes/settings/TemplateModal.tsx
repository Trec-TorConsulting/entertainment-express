import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Button,
  Badge,
  useToast,
  call
} from "@portal-kit";
import { Mail, Check, AlertCircle, Eye, Code, Trash2 } from "lucide-react";

export interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null; // null for creating new template
  onSuccess?: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  open,
  onOpenChange,
  template,
  onSuccess
}) => {
  const { toast } = useToast();
  const [key, setKey] = useState("");
  const [subject, setSubject] = useState("");
  const [channels, setChannels] = useState("email");
  const [priority, setPriority] = useState("transactional");
  const [active, setActive] = useState(true);
  const [body, setBody] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setKey(template.key || template.id || "");
        setSubject(template.subject || "");
        setChannels(template.channels || "email");
        setPriority(template.priority || "transactional");
        setActive(template.active === 1 || template.active === true);
        setBody(template.body || "");
      } else {
        setKey("");
        setSubject("");
        setChannels("email");
        setPriority("transactional");
        setActive(true);
        setBody(
          `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <h2>Notification Title</h2>\n  <p>Hello {{ doc.customer_name }},</p>\n  <p>Thank you for choosing {{ owner.company_name }}. Here are your event details:</p>\n  <ul>\n    <li><strong>Event:</strong> {{ doc.event_name }}</li>\n    <li><strong>Date:</strong> {{ doc.event_date }}</li>\n  </ul>\n  <p>If you have any questions, reply directly to this email!</p>\n</div>`
        );
      }
      setActiveTab("edit");
    }
  }, [open, template]);

  const handleKeyChange = (val: string) => {
    const formatted = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    setKey(formatted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast({ title: "Template key is required", variant: "danger" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Subject line is required", variant: "danger" });
      return;
    }

    setSaving(true);
    try {
      await call("entertainment_express.api.portal_notifications.save_template", {
        name: template?.id || key,
        values: {
          id: template?.id || key,
          key: key,
          subject: subject,
          channels: channels,
          priority: priority,
          active: active ? 1 : 0,
          body: body
        }
      });

      toast({
        title: template ? "Template Updated" : "Template Created",
        description: `Notification template '${key}' saved successfully.`,
        variant: "success"
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to Save Template",
        description: err.message || "An error occurred while saving.",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const samplePreviewHtml = body
    .replace(/\{\{\s*doc\.customer_name\s*\}\}/g, "Alex Morgan")
    .replace(/\{\{\s*doc\.event_name\s*\}\}/g, "Annual Gala Night")
    .replace(/\{\{\s*doc\.event_date\s*\}\}/g, "October 15, 2026")
    .replace(/\{\{\s*doc\.name\s*\}\}/g, "EVT-2026-0042")
    .replace(/\{\{\s*doc\.total_amount\s*\}\}/g, "$2,450.00")
    .replace(/\{\{\s*owner\.company_name\s*\}\}/g, "Express Entertainment");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={template ? `Edit Template: ${template.key}` : "Create New Notification Template"}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        {/* Editor vs Preview Tabs */}
        <div className="flex border-b border-[var(--ee-border)]">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "edit"
                ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
                : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            <Code className="w-4 h-4" /> Edit Template
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
                : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            <Eye className="w-4 h-4" /> Live Preview
          </button>
        </div>

        {activeTab === "edit" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Template Key (ID) *">
                <Input
                  type="text"
                  placeholder="e.g. deposit_reminder"
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  disabled={!!template}
                  required
                />
              </FormField>

              <FormField label="Priority Level">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                >
                  <option value="transactional">Transactional (Immediate)</option>
                  <option value="promotional">Promotional (Marketing)</option>
                  <option value="urgent">Urgent Alert</option>
                </select>
              </FormField>
            </div>

            <FormField label="Subject Line *">
              <Input
                type="text"
                placeholder="e.g. Booking Deposit Reminder for {{ doc.customer_name }}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Delivery Channels">
                <select
                  value={channels}
                  onChange={(e) => setChannels(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                >
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                  <option value="email,sms">Email + SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email,sms,push">Email + SMS + Push</option>
                </select>
              </FormField>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
                <div>
                  <div className="text-sm font-semibold text-[var(--ee-text)]">Active Status</div>
                  <div className="text-xs text-[var(--ee-muted)]">Enabled for automatic system dispatch</div>
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

            <FormField label="Template Body (HTML / Liquid syntax supported)">
              <textarea
                rows={9}
                className="w-full px-3 py-2 text-sm font-mono border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Insert email body HTML here...</p>"
              />
            </FormField>

            {/* Variable Cheatsheet */}
            <div className="p-3 bg-[var(--ee-surface-inset)] rounded-lg border border-[var(--ee-border)] space-y-1.5">
              <div className="text-xs font-bold text-[var(--ee-text)] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> Quick Dynamic Placeholders:
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {["{{ doc.customer_name }}", "{{ doc.event_date }}", "{{ doc.name }}", "{{ doc.total_amount }}", "{{ owner.company_name }}"].map((varName) => (
                  <button
                    key={varName}
                    type="button"
                    onClick={() => setBody((prev) => prev + " " + varName)}
                    className="px-2 py-0.5 rounded bg-[var(--ee-panel)] border border-[var(--ee-border)] text-[var(--ee-text)] hover:border-[var(--ee-brand)] font-mono text-[11px]"
                  >
                    + {varName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Preview Tab */
          <div className="space-y-4">
            <div className="p-3 bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] rounded-lg space-y-1">
              <div className="text-xs text-[var(--ee-muted)] font-semibold">SUBJECT LINE PREVIEW:</div>
              <div className="text-sm font-bold text-[var(--ee-text)]">
                {subject || "(No subject set)"}
              </div>
            </div>

            <div className="border border-[var(--ee-border)] rounded-xl overflow-hidden shadow-inner bg-white min-h-[300px] p-6 text-slate-800">
              <div dangerouslySetInnerHTML={{ __html: samplePreviewHtml }} />
            </div>
          </div>
        )}

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
