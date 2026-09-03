import React from "react";
import { clsx } from "clsx";

export interface DonutProgressProps {
  percentage: number; // 0 to 100
  size?: number; // diameter in px, default 48
  strokeWidth?: number;
  variant?: "brand" | "success" | "warning" | "danger";
  label?: string;
  showPercentText?: boolean;
  className?: string;
}

const variantColors = {
  brand: "var(--ee-brand)",
  success: "var(--ee-success)",
  warning: "var(--ee-warning)",
  danger: "var(--ee-danger)"
};

export const DonutProgress: React.FC<DonutProgressProps> = ({
  percentage = 0,
  size = 48,
  strokeWidth = 4,
  variant = "brand",
  label,
  showPercentText = true,
  className
}) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = variantColors[variant];

  return (
    <div className={clsx("relative inline-flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] select-none"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--ee-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {showPercentText && (
        <span className="absolute text-[11px] font-bold tabular-nums text-[var(--ee-text)]">
          {Math.round(clamped)}%
        </span>
      )}
      {label && <span className="sr-only">{label}: {clamped}%</span>}
    </div>
  );
};
