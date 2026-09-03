import React from "react";
import { clsx } from "clsx";
import { TrendChip, TrendDirection } from "./TrendChip";
import { Skeleton } from "../primitives/Skeleton";

export interface MetricCardProps {
  title: string;
  /**
   * Pre-formatted value string from server (e.g. "$42,500.00", "18 Events", "98.4%").
   */
  value: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: TrendDirection;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  icon,
  sparkline,
  badge,
  loading = false,
  onClick,
  className
}) => {
  if (loading) {
    return (
      <div className={clsx("p-5 rounded-[var(--ee-radius-lg)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] space-y-3 shadow-ee-sm", className)}>
        <div className="flex justify-between items-center">
          <Skeleton width="40%" height="1rem" />
          <Skeleton circle width="1.5rem" height="1.5rem" />
        </div>
        <Skeleton width="60%" height="2rem" />
        <Skeleton width="50%" height="0.875rem" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        "p-5 rounded-[var(--ee-radius-lg)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-ee-sm transition-all text-[var(--ee-text)]",
        onClick && "hover:border-[var(--ee-border-strong)] hover:shadow-ee-md cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--ee-muted)] uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && <span className="text-[var(--ee-muted)]">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
        {trend && (
          <TrendChip trend={trend} direction={trendDirection} />
        )}
      </div>

      {(subtitle || sparkline) && (
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[var(--ee-border-subtle)]">
          {subtitle && <span className="text-xs text-[var(--ee-muted)] truncate">{subtitle}</span>}
          {sparkline && <div className="shrink-0">{sparkline}</div>}
        </div>
      )}
    </div>
  );
};
