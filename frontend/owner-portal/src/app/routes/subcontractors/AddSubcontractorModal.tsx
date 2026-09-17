import React, { useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Select,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Handshake, ShieldCheck, CheckCircle2, Building2, X } from "lucide-react";

interface AddSubcontractorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddSubcontractorModal: React.FC<AddSubcontractorModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("DJ & Audio Production");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payTerms, setPayTerms] = useState("Net 15");
  const [coiOnFile, setCoiOnFile] = useState(true);
  const [w9OnFile, setW9OnFile] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast({ title: "Validation Error", description: "Subcontractor company name is required.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: vendorName.trim(),
        category,
        pay_terms: payTerms,
        coi_on_file: coiOnFile ? 1 : 0,
        w9_on_file: w9OnFile ? 1 : 0,
        notes,
        contacts: contactName ? [{ name: contactName, email, phone, role: "Dispatch Contact" }] : []
      };

      await call("entertainment_express.api.subcontractors.create_subcontractor", { values: payload });

      toast({
        title: "Subcontractor Registered",
        description: `Successfully added '${vendorName}' as a qualified subcontractor partner.`
      });

      // Reset form
      setVendorName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to save subcontractor partner.",
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50">
        <div className="bg-[var(--ee-panel)] border border-[var(--ee-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
            <h2 className="text-lg font-bold text-[var(--ee-text)] flex items-center gap-2">
              <Handshake className="w-5 h-5 text-[var(--ee-brand)]" />
              Register Subcontractor Partner
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg text-[var(--ee-muted)] hover:text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-3 text-xs text-purple-200">
          <Building2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white mb-0.5">Partner Entertainment Company</div>
            Register qualified vendors to sub-out overflow bookings, track COI compliance, and manage profit payouts.
          </div>
        </div>

        <FormField label="Subcontractor / Company Name" required>
          <Input
            placeholder="e.g. Apex DJ & Audio LLC, Bounce House Pros"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Primary Category">
            <Select value={category} onValueChange={setCategory}>
              <option value="DJ & Audio Production">DJ & Audio Production</option>
              <option value="Inflatables & Bounce Houses">Inflatables & Bounce Houses</option>
              <option value="Photo Booths & 360">Photo Booths & 360</option>
              <option value="Game Trucks & VR">Game Trucks & VR</option>
              <option value="Casino, Karaoke & Trivia">Casino, Karaoke & Trivia</option>
              <option value="Event Performers & Talent">Event Performers & Talent</option>
              <option value="General Production Vendor">General Production Vendor</option>
            </Select>
          </FormField>

          <FormField label="Default Payout Terms">
            <Select value={payTerms} onValueChange={setPayTerms}>
              <option value="Due on Completion">Due on Completion</option>
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
            </Select>
          </FormField>
        </div>

        <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ee-muted)]">
            Primary Contact Person
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--ee-text)] p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] cursor-pointer">
            <input
              type="checkbox"
              checked={coiOnFile}
              onChange={(e) => setCoiOnFile(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Active COI Insurance on File
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--ee-text)] p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] cursor-pointer">
            <input
              type="checkbox"
              checked={w9OnFile}
              onChange={(e) => setW9OnFile(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            W-9 Tax Form on File
          </label>
        </div>

        <FormField label="Special Notes / Equipment Capabilities">
          <textarea
            className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs focus:border-[var(--ee-brand)] transition-all"
            rows={2}
            placeholder="e.g. Preferred partner for wireless mic setups and JBL line arrays..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={busy} leftIcon={<Handshake className="w-4 h-4" />}>
            Save Partner Subcontractor
          </Button>
        </div>
      </form>
        </div>
      </div>
    </Dialog>
  );
};

