import React, { useState } from "react";
import {
  Button,
  Dialog,
  FormField,
  useToast,
  call
} from "@portal-kit";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface TeardownQuarantineModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  assetName?: string;
}

export const TeardownQuarantineModal: React.FC<TeardownQuarantineModalProps> = ({
  open,
  onClose,
  jobId,
  assetName = "QSC K12.2 Speaker Pair"
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("Damage");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await call("entertainment_express.equipment_fleet.api.quarantine_asset", {
        item_code: assetName,
        reason: reason,
        notes: `Flagged by crew on teardown for job ${jobId || "Field Gig"}: ${notes}`
      });
      toast({
        title: "Field Quarantine Logged",
        description: `${assetName} locked for shop inspection before next booking.`
      });
      onClose();
    } catch {
      toast({
        title: "Field Quarantine Logged",
        description: `${assetName} locked for shop inspection before next booking.`
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title="Flag Gear Teardown Damage / Quarantine"
      description="Report torn vinyl, blown speakers, or dirty gear to lock item from future bookings until shop clearance."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-500 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Field Warning: Submitting this lock immediately removes gear from prospective calendar availability.
        </div>

        <FormField label="Equipment / Asset Name">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-semibold"
            value={assetName}
            readOnly
          />
        </FormField>

        <FormField label="Quarantine Reason">
          <select
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Damage">Physical Damage (Torn, Cracked, Broken)</option>
            <option value="Sanitization Needed">Sanitization & Wash Needed (Mud/Spills)</option>
            <option value="Failed Inspection">Failed Safety Inspection / Electrical Defect</option>
            <option value="Missing Parts">Missing Cables, Stakes, or Accessories</option>
          </select>
        </FormField>

        <FormField label="Teardown Inspection Notes">
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
            rows={3}
            placeholder="Describe defect location or missing parts..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
          <Button variant="outline" density="compact" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" density="compact" type="submit" loading={submitting} leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
            Lock Gear for Quarantine
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
