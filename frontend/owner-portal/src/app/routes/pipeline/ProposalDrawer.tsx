import React from "react";
import { Badge, Button } from "@portal-kit";
import { Eye, Clock, ShieldCheck, FileCheck, CheckCircle2, X } from "lucide-react";

interface ProposalDrawerProps {
  open: boolean;
  onClose: () => void;
  proposal?: any;
}

export const ProposalDrawer: React.FC<ProposalDrawerProps> = ({ open, onClose, proposal }) => {
  if (!open) return null;

  const sample = proposal || {
    name: "PROP-2026-001",
    status: "Viewed",
    view_count: 4,
    first_viewed_at: "2026-09-21 07:12:00",
    last_viewed_at: "2026-09-21 07:45:00",
    selected_package: "Gold Premium Event Suite",
    selected_addons: ["Cold Spark Fountains", "LED Uplighting 12-Pack"],
    signer_name: "Tobey Rector",
    signed_at: "2026-09-21 07:46:00",
    signer_ip: "68.42.19.102"
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--ee-surface)] border-l border-[var(--ee-border)] shadow-2xl flex flex-col justify-between p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[var(--ee-brand)] font-bold uppercase tracking-wider">
                  Proposal Telemetry
                </span>
                <h3 className="font-bold text-lg text-[var(--ee-text)]">{sample.name}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded text-[var(--ee-muted)] hover:bg-[var(--ee-border)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center justify-between">
                <span className="text-[var(--ee-muted)] font-medium">Status</span>
                <Badge variant={sample.status === "Accepted" ? "success" : "warning"} size="sm">
                  {sample.status}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--ee-muted)]">Total Views:</span>
                  <strong className="text-[var(--ee-text)] font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> {sample.view_count} times
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ee-muted)]">First Opened:</span>
                  <span className="text-[var(--ee-text)]">{sample.first_viewed_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ee-muted)]">Last Activity:</span>
                  <span className="text-[var(--ee-text)]">{sample.last_viewed_at}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-2">
                <div className="font-bold text-[var(--ee-text)]">Staged Package & Upsells</div>
                <div className="text-[var(--ee-brand)] font-semibold">{sample.selected_package}</div>
                <div className="text-[var(--ee-muted)]">
                  Add-ons: {(sample.selected_addons || []).join(", ") || "None"}
                </div>
              </div>

              {sample.signer_name && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                  <div className="font-bold text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Legal E-Signature Record
                  </div>
                  <div>Signer: <strong>{sample.signer_name}</strong></div>
                  <div>IP Address: <span className="font-mono">{sample.signer_ip}</span></div>
                  <div>Signed Datetime: {sample.signed_at}</div>
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" density="compact" onClick={onClose}>
            Close Telemetry Drawer
          </Button>
        </div>
      </div>
    </div>
  );
};
