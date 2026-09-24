import React, { useState } from "react";
import {
  Dialog,
  Button,
  useToast,
  call
} from "@portal-kit";
import { Download, Sparkles, Check, Disc, Castle, Camera, Truck, Music, Layers } from "lucide-react";

export interface ImportBundleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ImportBundleModal: React.FC<ImportBundleModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [selectedVertical, setSelectedVertical] = useState("djs");
  const [importing, setImporting] = useState(false);

  const verticals = [
    {
      code: "djs",
      label: "DJs, MCs & Mobile Entertainment",
      description: "Performance contracts, song request forms, deposit reminders & timeline prompts.",
      icon: <Disc className="w-5 h-5 text-indigo-500" />
    },
    {
      code: "inflatables",
      label: "Inflatables & Party Rentals",
      description: "Safety waivers, wind/weather shutdown policies, site prep & power delivery alerts.",
      icon: <Castle className="w-5 h-5 text-amber-500" />
    },
    {
      code: "photo_booths",
      label: "Photo Booths & 360 Spinners",
      description: "Booth rental agreements, print customization forms, digital photo gallery alerts.",
      icon: <Camera className="w-5 h-5 text-pink-500" />
    },
    {
      code: "game_trucks",
      label: "Mobile Game Trucks & Laser Tag",
      description: "Mobile theater party contracts, parking/driveway clearance checklists.",
      icon: <Truck className="w-5 h-5 text-emerald-500" />
    },
    {
      code: "general",
      label: "General Event Entertainment & Production",
      description: "Standard event production contracts, balance due reminders, cancellation terms.",
      icon: <Layers className="w-5 h-5 text-blue-500" />
    }
  ];

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await call("entertainment_express.api.starter_bundles.seed_vertical_bundle", {
        vertical: selectedVertical
      });

      toast({
        title: "Starter Bundle Imported!",
        description: `Successfully loaded ${res.contracts_imported} contract templates & ${res.notifications_imported} notification templates into your workspace.`,
        variant: "success"
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || "Could not import vertical bundle.",
        variant: "danger"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Industry Starter Pack (Contracts & Email Templates)"
    >
      <div className="space-y-4 pt-2">
        <p className="text-sm text-[var(--ee-muted)]">
          Select your business vertical to instantly populate your workspace with industry-tested contracts, liability waivers, and email automation templates.
        </p>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {verticals.map((v) => (
            <div
              key={v.code}
              onClick={() => setSelectedVertical(v.code)}
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedVertical === v.code
                  ? "bg-[var(--ee-surface-inset)] border-[var(--ee-brand)] ring-1 ring-[var(--ee-brand)] shadow-sm"
                  : "bg-[var(--ee-panel)] border-[var(--ee-border)] hover:border-slate-400"
              }`}
            >
              <div className="p-2.5 bg-[var(--ee-surface)] rounded-lg border border-[var(--ee-border)] shrink-0">
                {v.icon}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="font-bold text-sm text-[var(--ee-text)] flex items-center justify-between">
                  <span>{v.label}</span>
                  {selectedVertical === v.code && (
                    <span className="text-xs font-bold text-[var(--ee-brand)] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ee-muted)]">{v.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--ee-border)]">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} loading={importing}>
            <Download className="w-4 h-4 mr-1.5" />
            Import Selected Pack
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
