import React, { useState } from "react";
import {
  Dialog,
  Button,
  Input,
  FormField,
  Badge,
  useToast,
  call
} from "@portal-kit";
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

interface VanInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  eventName?: string;
}

export const VanInspectionModal: React.FC<VanInspectionModalProps> = ({
  isOpen,
  onClose,
  bookingId = "BK-2026-00042",
  eventName = "Event Booking"
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"loadout" | "damage">("loadout");
  const [loadoutText, setLoadoutText] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loadoutResult, setLoadoutResult] = useState<any | null>(null);

  // Damage state
  const [assetId, setAssetId] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [reportingDamage, setReportingDamage] = useState(false);
  const [damageResult, setDamageResult] = useState<any | null>(null);

  const handleVerifyLoadout = async () => {
    setVerifying(true);
    try {
      const res = await call("entertainment_express.api.vision_van_inspection.verify_van_loadout", {
        booking_id: bookingId,
        visible_labels: loadoutText || undefined
      });
      setLoadoutResult(res);
      if (res.is_complete) {
        toast({ title: "Loadout Verified!", description: "All equipment accounted for.", variant: "success" });
      } else {
        toast({ title: "Missing Equipment!", description: `${res.missing_items?.length} item(s) missing before departure.`, variant: "warning" });
      }
    } catch (err: any) {
      toast({ title: "Loadout Check Failed", description: err.message, variant: "danger" });
    } finally {
      setVerifying(false);
    }
  };

  const handleReportDamage = async () => {
    if (!assetId.trim() || !damageNotes.trim()) {
      toast({ title: "Fields Required", description: "Asset ID and damage notes are required.", variant: "warning" });
      return;
    }
    setReportingDamage(true);
    try {
      const res = await call("entertainment_express.api.vision_van_inspection.inspect_teardown_damage", {
        asset_id: assetId,
        booking_id: bookingId,
        damage_notes: damageNotes
      });
      setDamageResult(res);
      toast({ title: "Asset Quarantined", description: `Held $${res.hold_amount} deposit claim on booking.`, variant: "danger" });
    } catch (err: any) {
      toast({ title: "Damage Report Failed", description: err.message, variant: "danger" });
    } finally {
      setReportingDamage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} title="Computer Vision Smart Van Eye">
      <div className="space-y-4 pt-2">
        <div className="flex rounded-lg border border-[var(--ee-border)] p-1 bg-[var(--ee-surface-inset)]">
          <button
            type="button"
            onClick={() => setActiveTab("loadout")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "loadout"
                ? "bg-[var(--ee-surface-base)] text-[var(--ee-text)] shadow-sm"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            Van Load-Out Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("damage")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "damage"
                ? "bg-[var(--ee-surface-base)] text-[var(--ee-text)] shadow-sm"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            }`}
          >
            Teardown Damage Quarantine
          </button>
        </div>

        {activeTab === "loadout" ? (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[var(--ee-text)] block">{eventName}</span>
                <span className="text-[var(--ee-muted)]">{bookingId}</span>
              </div>
              <Badge variant="outline">Production BOM Check</Badge>
            </div>

            <FormField
              label="Van Inventory Labels / Camera OCR"
              description="Confirm visible equipment barcodes, flight cases, or speaker serials"
            >
              <textarea
                className="w-full h-20 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                placeholder="2x QSC K12.2 Speakers, 1x Subwoofer, 1x DJ Controller Flight Case..."
                value={loadoutText}
                onChange={(e) => setLoadoutText(e.target.value)}
              />
            </FormField>

            <Button
              variant="primary"
              density="cockpit"
              onClick={handleVerifyLoadout}
              disabled={verifying}
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              className="w-full"
            >
              {verifying ? "Inspecting Cargo..." : "Scan & Verify Van Load-Out"}
            </Button>

            {loadoutResult && (
              <div className={`p-3.5 rounded-xl border space-y-2 animate-in fade-in-50 ${
                loadoutResult.is_complete
                  ? "border-[var(--ee-success)] bg-[var(--ee-surface-inset)]"
                  : "border-[var(--ee-warning)] bg-[var(--ee-surface-inset)]"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--ee-text)] flex items-center gap-1.5">
                    {loadoutResult.is_complete ? (
                      <ShieldCheck className="w-4 h-4 text-[var(--ee-success)]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[var(--ee-warning)]" />
                    )}
                    Fulfillment: {loadoutResult.fulfillment_rate}%
                  </span>
                  <Badge variant={loadoutResult.is_complete ? "success" : "warning"}>
                    {loadoutResult.is_complete ? "Ready to Roll" : "Missing Gear"}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--ee-muted)]">{loadoutResult.alert_message}</p>
                {loadoutResult.missing_items?.length > 0 && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                    Missing: {loadoutResult.missing_items.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <FormField label="Damaged Asset ID" required>
              <Input
                placeholder="e.g. AST-INFLATABLE-01 or AST-SPEAKER-04"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              />
            </FormField>

            <FormField label="Damage Inspection Findings" description="Describe tears, cracks, seam failure, liquid damage" required>
              <textarea
                className="w-full h-20 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                placeholder="e.g. Torn lower bounce seam with visible 4-inch rip. Air escaping under load."
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
              />
            </FormField>

            <Button
              variant="danger"
              density="cockpit"
              onClick={handleReportDamage}
              disabled={reportingDamage || !assetId.trim() || !damageNotes.trim()}
              leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
              className="w-full"
            >
              {reportingDamage ? "Processing Quarantine..." : "Flag Damage & Hold Client Deposit"}
            </Button>

            {damageResult && (
              <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/5 space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Asset Quarantined
                  </span>
                  <Badge variant="danger">${damageResult.hold_amount} Hold Flagged</Badge>
                </div>
                <p className="text-[11px] text-[var(--ee-muted)]">{damageResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
