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

export interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any | null; // null for new contract
  templates: any[];
  onSuccess?: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  open,
  onOpenChange,
  contract,
  templates = [],
  onSuccess
}) => {
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [quotation, setQuotation] = useState("");
  const [booking, setBooking] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [status, setStatus] = useState("draft");
  const [body, setBody] = useState("");
  const [sendSignatureRequest, setSendSignatureRequest] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (contract) {
        setSignerName(contract.signer_name || "");
        setSignerEmail(contract.signer_email || "");
        setQuotation(contract.quotation || "");
        setBooking(contract.booking || "");
        setSelectedTemplate(contract.template || "");
        setStatus(contract.status || "draft");
        setBody(contract.rendered_html || "");
        setSendSignatureRequest(false);
      } else {
        setSignerName("");
        setSignerEmail("");
        setQuotation("");
        setBooking("");
        setSelectedTemplate("");
        setStatus("draft");
        setBody(
          `<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">PERFORMANCE & SERVICE AGREEMENT</h2>\n  <p>This Binding Agreement is entered into between <strong>{{ owner.company_name }}</strong> ("Provider") and <strong>{{ doc.signer_name }}</strong> ("Client").</p>\n  <h3>1. Scope of Services & Equipment</h3>\n  <p>Provider agrees to perform professional entertainment services for the event on <strong>{{ doc.event_date }}</strong> at <strong>{{ doc.venue_address }}</strong>.</p>\n  <h3>2. Compensation & Payment Schedule</h3>\n  <p>Total Contract Price: <strong>{{ doc.grand_total }}</strong>.<br/>A non-refundable deposit of <strong>{{ doc.deposit_amount }}</strong> is required upon signature.</p>\n  <h3>3. Terms & Cancellation Policy</h3>\n  <p>In the event of cancellation by Client within 14 days of the event, deposit shall be forfeited.</p>\n  <br/>\n  <p style="font-style: italic;">By typing your name below, you agree to all terms and conditions outlined in this binding contract.</p>\n</div>`
        );
        setSendSignatureRequest(true);
      }
    }
  }, [open, contract]);

  const handleTemplateSelect = (tmplId: string) => {
    setSelectedTemplate(tmplId);
    if (!tmplId) return;
    const found = templates.find((t) => t.name === tmplId);
    if (found && found.body) {
      setBody(found.body);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      toast({ title: "Signer Name is required", variant: "danger" });
      return;
    }

    setSaving(true);
    try {
      await call("entertainment_express.api.contract.save_contract", {
        name: contract?.name,
        values: {
          signer_name: signerName,
          signer_email: signerEmail,
          quotation: quotation,
          booking: booking,
          template: selectedTemplate,
          status: status,
          body: body,
          send_signature_request: sendSignatureRequest
        }
      });

      toast({
        title: contract ? "Contract Updated" : "Contract Created",
        description: sendSignatureRequest && signerEmail
          ? `Saved contract and sent signature request email to ${signerEmail}.`
          : "Saved contract details.",
        variant: "success"
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to Save Contract",
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
      title={contract ? `Edit Contract: ${contract.name}` : "Create New Binding Contract / Agreement"}
      className="max-w-4xl max-h-[92vh] overflow-y-auto"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Client / Signer Full Name *">
            <Input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Signer Email Address">
            <Input
              type="email"
              placeholder="e.g. alex@example.com"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Contract Template">
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
            >
              <option value="">(Custom / Blank Template)</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.template_name || t.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Linked Quotation (Optional)">
            <Input
              type="text"
              placeholder="e.g. QT-2026-0012"
              value={quotation}
              onChange={(e) => setQuotation(e.target.value)}
            />
          </FormField>

          <FormField label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent (Pending Signature)</option>
              <option value="viewed">Viewed by Signer</option>
              <option value="signed">Signed</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>
          </FormField>
        </div>

        <FormField label="Contract & Agreement Terms (WYSIWYG & Visual Studio)">
          <RichContractEditor
            value={body}
            onChange={setBody}
            signerName={signerName}
            signerEmail={signerEmail}
            height="h-[480px]"
          />
        </FormField>

        {/* Signature Request Options */}
        <div className="p-3 bg-[var(--ee-surface-inset)] rounded-lg border border-[var(--ee-border)] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--ee-text)]">
              Request E-Signature Immediately
            </div>
            <div className="text-xs text-[var(--ee-muted)]">
              Sends tokenized signature email to {signerEmail || "signer"}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={sendSignatureRequest}
              onChange={(e) => setSendSignatureRequest(e.target.checked)}
              disabled={!signerEmail}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ee-brand)] peer-disabled:opacity-50"></div>
          </label>
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
            {contract ? "Save Contract Changes" : "Create Contract"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
