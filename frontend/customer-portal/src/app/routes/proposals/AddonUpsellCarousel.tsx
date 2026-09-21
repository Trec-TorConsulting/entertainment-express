import React from "react";
import { Badge, Button } from "@portal-kit";
import { Plus, Check, Sparkles, ThumbsUp } from "lucide-react";

export interface AddonOption {
  item_code: string;
  title: string;
  price: number;
  thumbnail?: string;
  description: string;
  is_recommended?: boolean;
}

interface AddonUpsellCarouselProps {
  addons: AddonOption[];
  selectedAddons: string[];
  onToggle: (itemCode: string) => void;
}

export const AddonUpsellCarousel: React.FC<AddonUpsellCarouselProps> = ({ addons, selectedAddons, onToggle }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {addons.map((addon) => {
        const isAdded = selectedAddons.includes(addon.item_code);
        return (
          <div
            key={addon.item_code}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 bg-[var(--ee-surface)] ${
              isAdded
                ? "border-[var(--ee-brand)] bg-[var(--ee-brand)]/5"
                : "border-[var(--ee-border)] hover:border-[var(--ee-brand)]/50"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-sm text-[var(--ee-text)]">{addon.title}</h4>
                {addon.is_recommended && (
                  <Badge variant="warning" size="sm">
                    <ThumbsUp className="w-3 h-3 mr-1" /> Top Choice
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[var(--ee-muted)]">{addon.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--ee-border)]">
              <span className="font-bold text-base text-[var(--ee-text)]">+${addon.price.toLocaleString()}</span>
              <Button
                density="compact"
                variant={isAdded ? "primary" : "outline"}
                onClick={() => onToggle(addon.item_code)}
                leftIcon={isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              >
                {isAdded ? "Added" : "Add to Event"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
