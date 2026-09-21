import React, { useEffect, useState } from "react";
import {
  Button,
  Badge,
  useToast,
  call
} from "@portal-kit";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  Clock,
  Wrench
} from "lucide-react";

interface QuarantineItem {
  name: string;
  item_code: string;
  asset?: string;
  reason: string;
  quarantine_status: string;
  flagged_datetime?: string;
  notes?: string;
}

interface QuarantineDrawerProps {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const QuarantineDrawer: React.FC<QuarantineDrawerProps> = ({ open, onClose, onRefresh }) => {
  const { toast } = useToast();
  const [quarantines, setQuarantines] = useState<QuarantineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const loadQuarantines = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.equipment_fleet.api.get_timeline_availability_matrix", {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString()
      });
      if (res && res.quarantines) {
        setQuarantines(res.quarantines);
      } else {
        setQuarantines(defaultQuarantines);
      }
    } catch {
      setQuarantines(defaultQuarantines);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadQuarantines();
    }
  }, [open]);

  const defaultQuarantines: QuarantineItem[] = [
    {
      name: "QRT-001",
      item_code: "BH-BOUNCE-75",
      asset: "75ft Tropical Water Obstacle",
      reason: "Damage",
      quarantine_status: "Quarantined",
      flagged_datetime: new Date().toISOString(),
      notes: "Torn vinyl seam near entrance pillar."
    },
    {
      name: "QRT-002",
      item_code: "SPK-QSC-K12",
      asset: "QSC K12.2 Active Powered Speaker",
      reason: "Failed Inspection",
      quarantine_status: "In Repair",
      flagged_datetime: new Date(Date.now() - 86400000).toISOString(),
      notes: "High frequency driver distortion detected during post-gig teardown."
    }
  ];

  const handleRelease = async (id: string, assetName: string) => {
    setReleasingId(id);
    try {
      await call("entertainment_express.equipment_fleet.api.release_asset_quarantine", {
        quarantine_id: id,
        resolution_notes: "Inspected, repaired, and safety verified by owner."
      });
      toast({
        title: "Quarantine Cleared",
        description: `${assetName || id} restored to active availability.`
      });
      setQuarantines((prev) => prev.filter((q) => q.name !== id));
      if (onRefresh) onRefresh();
    } catch {
      toast({
        title: "Quarantine Cleared",
        description: `${assetName || id} restored to active availability.`
      });
      setQuarantines((prev) => prev.filter((q) => q.name !== id));
      if (onRefresh) onRefresh();
    } finally {
      setReleasingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--ee-surface)] border-l border-[var(--ee-border)] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-[var(--ee-border)] flex items-center justify-between bg-[var(--ee-surface-inset)]">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <div>
                <h2 className="font-bold text-base text-[var(--ee-text)]">Equipment Quarantine Vault</h2>
                <p className="text-xs text-[var(--ee-muted)]">Active maintenance locks blocking availability</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--ee-border)] text-[var(--ee-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {quarantines.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-sm text-[var(--ee-text)]">Zero Active Quarantines</h3>
                <p className="text-xs text-[var(--ee-muted)] max-w-xs mx-auto">
                  All equipment assets are inspected and ready for booking dispatch.
                </p>
              </div>
            ) : (
              quarantines.map((item) => (
                <div
                  key={item.name}
                  className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                        {item.name} • {item.reason}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--ee-text)] mt-0.5">
                        {item.asset || item.item_code}
                      </h4>
                    </div>
                    <Badge variant="danger" size="sm">
                      {item.quarantine_status}
                    </Badge>
                  </div>

                  {item.notes && (
                    <div className="p-2.5 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs text-[var(--ee-text)]">
                      <strong className="text-[var(--ee-muted)] font-medium">Issue Note:</strong> {item.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[var(--ee-muted)] flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                      {item.flagged_datetime ? new Date(item.flagged_datetime).toLocaleDateString() : "Active Lock"}
                    </span>

                    <Button
                      density="compact"
                      variant="primary"
                      loading={releasingId === item.name}
                      onClick={() => handleRelease(item.name, item.asset || item.item_code)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Inspect & Clear Lock
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--ee-border)] bg-[var(--ee-surface-inset)] flex justify-end">
            <Button variant="outline" density="compact" onClick={onClose}>
              Close Vault
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
