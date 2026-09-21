import React from "react";
import { Badge } from "@portal-kit";
import { Check, Star } from "lucide-react";

export interface PackageOption {
  item_code: string;
  title: string;
  badge?: string;
  base_price: number;
  description: string;
  features: string[];
}

interface TierSelectorGridProps {
  packages: PackageOption[];
  selectedCode: string;
  onSelect: (itemCode: string) => void;
}

export const TierSelectorGrid: React.FC<TierSelectorGridProps> = ({ packages, selectedCode, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packages.map((pkg) => {
        const isSelected = selectedCode === pkg.item_code;
        return (
          <div
            key={pkg.item_code}
            onClick={() => onSelect(pkg.item_code)}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative bg-[var(--ee-surface)] ${
              isSelected
                ? "border-[var(--ee-brand)] shadow-xl ring-2 ring-[var(--ee-brand)]/20"
                : "border-[var(--ee-border)] hover:border-[var(--ee-brand)]/50"
            }`}
          >
            {pkg.badge && (
              <div className="absolute -top-3 right-4">
                <Badge variant="brand" size="sm" className="shadow-md">
                  <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                  {pkg.badge}
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--ee-text)]">{pkg.title}</h3>
                <p className="text-xs text-[var(--ee-muted)] mt-1">{pkg.description}</p>
              </div>

              <div className="text-3xl font-extrabold text-[var(--ee-text)]">
                ${pkg.base_price.toLocaleString()}{" "}
                <span className="text-xs font-normal text-[var(--ee-muted)]">/ event</span>
              </div>

              <div className="border-t border-[var(--ee-border)] pt-4 space-y-2">
                {pkg.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--ee-text)]">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  isSelected
                    ? "bg-[var(--ee-brand)] text-white"
                    : "bg-[var(--ee-surface-inset)] text-[var(--ee-text)] hover:bg-[var(--ee-border)]"
                }`}
              >
                {isSelected ? "✓ Selected Tier" : "Select Package"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
