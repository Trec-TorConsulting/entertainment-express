import React from "react";
import * as RadixProgress from "@radix-ui/react-progress";
import { clsx } from "clsx";

export interface ProgressProps {
  value?: number; // 0 to 100
  max?: number;
  variant?: "brand" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantFills = {
  brand: "bg-[var(--ee-brand)]",
  success: "bg-[var(--ee-success)]",
  warning: "bg-[var(--ee-warning)]",
  danger: "bg-[var(--ee-danger)]"
};

const sizeHeights = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4"
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  variant = "brand",
  size = "md",
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <RadixProgress.Root
      value={value}
      max={max}
      className={clsx(
        "relative w-full overflow-hidden rounded-full bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]",
        sizeHeights[size],
        className
      )}
    >
      <RadixProgress.Indicator
        className={clsx(
          "h-full w-full flex-1 transition-all duration-300 ease-in-out",
          variantFills[variant]
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </RadixProgress.Root>
  );
};
