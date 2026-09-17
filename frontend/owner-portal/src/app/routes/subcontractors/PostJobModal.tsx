import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Select,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Handshake, Globe, Lock, ShieldCheck, X } from "lucide-react";

interface PostJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [agreedCost, setAgreedCost] = useState("");
  const [payTerms, setPayTerms] = useState("Due on Completion");
  const [visibility, setVisibility] = useState("private"); // 'private' or 'b2b_network'
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.allSettled([
        call("entertainment_express.api.portal_owner.get_owner_dashboard", {}),
        call("entertainment_express.api.subcontractors.list_subcontractors", {})
      ]).then(([jobsRes, partnersRes]) => {
        if (jobsRes.status === "fulfilled" && jobsRes.value?.jobs) {
          setBookings(jobsRes.value.jobs);
        }
        if (partnersRes.status === "fulfilled" && Array.isArray(partnersRes.value)) {
          setPartners(partnersRes.value);
        }
      }).finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) {
      toast({ title: "Validation Error", description: "Please select an event booking to post.", variant: "destructive" });
      return;
    }
    if (!agreedCost || parseFloat(agreedCost) <= 0) {
      toast({ title: "Validation Error", description: "Agreed payout amount is required.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        booking: selectedBooking,
        vendor: selectedVendor || undefined,
        agreed_cost: parseFloat(agreedCost),
        pay_terms: payTerms,
        scope_type: visibility,
        special_instructions: specialInstructions,
        status: "board_listed"
      };

      await call("entertainment_express.api.subcontractors.create_subcontract_job", { values: payload });

      toast({
        title: "Job Posted to Board",
        description: visibility === "b2b_network"
          ? "Job published to B2B Network Exchange for opt-in partners."
          : "Job listed on your Private Partner Job Board."
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Posting Failed",
        description: err.message || "Failed to post overflow job.",
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
              Post Overflow Job to Board
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg text-[var(--ee-muted)] hover:text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Select Overbooked / Overflow Event Booking" required>
              <Select value={selectedBooking} onValueChange={setSelectedBooking} required>
                <option value="">-- Choose Booking --</option>
                {bookings.map((b) => (
                  <option key={b.id || b.name} value={b.id || b.name}>
                    {b.title || b.event_name || b.name} ({b.when || b.event_date || "Upcoming"})
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Agreed Subcontractor Payout ($)" required>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1000.00"
                  value={agreedCost}
                  onChange={(e) => setAgreedCost(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Payout Terms">
                <Select value={payTerms} onValueChange={setPayTerms}>
                  <option value="Due on Completion">Due on Completion</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Target Audience / Board Visibility">
              <Select value={visibility} onValueChange={setVisibility}>
                <option value="private">🔒 Private (Pre-Approved Partners Only)</option>
                <option value="b2b_network">🌐 B2B Network Exchange (Opt-In Operators)</option>
              </Select>
            </FormField>

            {visibility === "private" && (
              <FormField label="Specific Preferred Partner (Optional)">
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <option value="">-- Open to All Pre-Approved Partners --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || "Partner"})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-2.5 text-xs text-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Automated COI Compliance Gate:</span> Claiming partners must have an active Certificate of Insurance ($1M+ coverage) on file to claim network listings.
              </div>
            </div>

            <FormField label="Special Instructions & Logistics Run Sheet">
              <textarea
                className="w-full px-3 py-2 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-xs focus:border-[var(--ee-brand)] transition-all"
                rows={3}
                placeholder="e.g. Load-in at rear dock by 3 PM. Sound check at 4 PM. Dress code: Formal black..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={busy} leftIcon={<Handshake className="w-4 h-4" />}>
                Publish Job Listing
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};
