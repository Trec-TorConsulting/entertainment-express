import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendChipProps {
  /**
   * Pre-formatted trend string from the backend (e.g. "+14.2%", "-3.1%", "No change").
   * Client-side parsing of currencies or numeric formatting is strictly prohibited.
   */
  trend: string;
  direction?: TrendDirection;
  className?: string;
}

export const TrendChip: React.FC<TrendChipProps> = ({
  trend,
  direction,
  className
}) => {
  // Infer direction from leading +/- if not explicitly passed
  let resolvedDirection: TrendDirection = direction || "neutral";
  if (!direction) {
    if (trend.startsWith("+")) resolvedDirection = "up";
    else if (trend.startsWith("-")) resolvedDirection = "down";
  }

  const isUp = resolvedDirection === "up";
  const isDown = resolvedDirection === "down";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums select-none",
        isUp && "bg-[var(--ee-success-soft)] text-[var(--ee-success-text)] border border-[var(--ee-success-border)]",
        isDown && "bg-[var(--ee-danger-soft)] text-[var(--ee-danger-text)] border border-[var(--ee-danger-border)]",
        !isUp && !isDown && "bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] border border-[var(--ee-border)]",
        className
      )}
    >
      {isUp && <TrendingUp className="w-3 h-3 shrink-0 text-[var(--ee-success)]" />}
      {isDown && <TrendingDown className="w-3 h-3 shrink-0 text-[var(--ee-danger)]" />}
      {!isUp && !isDown && <Minus className="w-3 h-3 shrink-0 text-[var(--ee-muted)]" />}
      <span>{trend}</span>
    </span>
  );
};
