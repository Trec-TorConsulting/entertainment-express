import React, { useEffect, useState } from "react";
import {
  Dialog,
  FormField,
  Input,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Handshake, AlertTriangle, ShieldCheck } from "lucide-react";

export interface SubOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess?: (job: any) => void;
}

export const SubOutModal: React.FC<SubOutModalProps> = ({
  open,
  onOpenChange,
  booking,
  onSuccess
}) => {
  const { toast } = useToast();
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [agreedCost, setAgreedCost] = useState("");
  const [clientPrice, setClientPrice] = useState("");
  const [payTerms, setPayTerms] = useState("Net 15");
  const [whiteLabel, setWhiteLabel] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadSubcontractors();
      if (booking) {
        const price = booking.grand_total || booking.total_amount || booking.price || 0;
        setClientPrice(String(price));
      }
    }
  }, [open, booking]);

  const loadSubcontractors = async () => {
    setLoadingPartners(true);
    try {
      const list = await call("entertainment_express.api.subcontractors.list_subcontractors", {});
      setSubcontractors(list || []);
    } catch {
      setSubcontractors([]);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handlePartnerChange = (id: string) => {
    setVendorId(id);
    const partner = subcontractors.find((s) => s.id === id);
    setSelectedPartner(partner || null);
    if (partner?.default_pay_terms) {
      setPayTerms(partner.default_pay_terms);
    }
  };

  const calculatedMargin = () => {
    const cp = parseFloat(clientPrice) || 0;
    const ac = parseFloat(agreedCost) || 0;
    const margin = cp - ac;
    const pct = cp > 0 ? (margin / cp) * 100 : 0;
    return { margin, pct };
  };

  const { margin, pct } = calculatedMargin();

  const handleSubOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast({ title: "Partner Required", description: "Please select a subcontractor partner.", variant: "destructive" });
      return;
    }
    if (!agreedCost || parseFloat(agreedCost) <= 0) {
      toast({ title: "Cost Required", description: "Please enter an agreed subcontractor payout cost.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await call("entertainment_express.api.subcontractors.create_subcontract_job", {
        values: {
          booking: booking.id || booking.name,
          vendor: vendorId,
          agreed_cost: parseFloat(agreedCost),
          client_price: parseFloat(clientPrice) || 0,
          pay_terms: payTerms,
          white_label: whiteLabel ? 1 : 0,
          special_instructions: specialInstructions
        }
      });

      if (res?.compliance_warning) {
        toast({ title: "Sub-Out Created with Compliance Note", description: res.compliance_warning, variant: "destructive" });
      } else {
        toast({ title: "Job Subbed Out", description: `Subcontract job ${res.id} created successfully.` });
      }

      onOpenChange(false);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      toast({ title: "Failed to sub out", description: err.message || "Could not create subcontract job", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Sub Out Booking to Partner">
      <form onSubmit={handleSubOut} className="space-y-4 pt-2">
        {/* Booking Summary Pre-fill */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5 text-primary" />
            {booking?.title || booking?.event_name || booking?.id || "Event Booking"}
          </div>
          <div className="text-slate-500">Date: {booking?.event_date || booking?.date || "TBD"}</div>
          <div className="text-slate-500">Venue: {booking?.venue || booking?.venue_name || "TBD"}</div>
          <div className="text-slate-500">Client Price: ${parseFloat(clientPrice || "0").toLocaleString()}</div>
        </div>

        {/* Subcontractor Partner Picker */}
        <FormField label="Select Subcontractor Partner">
          <select
            className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
            value={vendorId}
            onChange={(e) => handlePartnerChange(e.target.value)}
            disabled={loadingPartners}
          >
            <option value="">-- Choose a qualified subcontractor --</option>
            {subcontractors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.category ? `(${s.category})` : ""} {s.coi_on_file ? "✓ Insured" : "⚠️ No COI"}
              </option>
            ))}
          </select>
        </FormField>

        {/* Compliance Alert if partner missing COI or W9 */}
        {selectedPartner && (!selectedPartner.coi_on_file || !selectedPartner.w9_on_file) && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-semibold">Compliance Document Warning</div>
              <div>
                {!selectedPartner.coi_on_file && "Missing Certificate of Insurance (COI). "}
                {!selectedPartner.w9_on_file && "Missing W-9 form. "}
              </div>
            </div>
          </div>
        )}

        {/* Financial & Margin Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Agreed Subcontractor Cost ($)">
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 1200.00"
              value={agreedCost}
              onChange={(e) => setAgreedCost(e.target.value)}
            />
          </FormField>
          <FormField label="Payment Terms">
            <Input
              type="text"
              placeholder="e.g. Net 15"
              value={payTerms}
              onChange={(e) => setPayTerms(e.target.value)}
            />
          </FormField>
        </div>

        {/* Realtime Margin Pill Preview */}
        {parseFloat(agreedCost) > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <span className="font-medium text-emerald-800 dark:text-emerald-200">Expected Profit Margin:</span>
            <span className="font-bold text-emerald-900 dark:text-emerald-100">
              ${margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
            </span>
          </div>
        )}

        {/* Privacy / White-Label Toggle */}
        <div className="flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              White-Label Mode
            </div>
            <div className="text-xs text-slate-500">
              Mask client direct phone/email and invoice pricing on external job packet
            </div>
          </div>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
            checked={whiteLabel}
            onChange={(e) => setWhiteLabel(e.target.checked)}
          />
        </div>

        {/* Special Instructions */}
        <FormField label="Special Instructions for Partner Company">
          <textarea
            className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 h-20"
            placeholder="Load-in dock rules, uniform code, attire, emergency contact..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </FormField>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating Sub-Out..." : "Create Subcontract Job"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
