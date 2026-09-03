import React from "react";
import { clsx } from "clsx";

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  badge,
  className
}) => {
  return (
    <div className={clsx("flex flex-col gap-4 pb-6 border-b border-[var(--ee-border)] sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="text-xs text-[var(--ee-muted)] mb-1 flex items-center gap-1.5">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ee-text)] sm:text-3xl">
            {title}
          </h1>
          {badge && <span className="inline-flex items-center">{badge}</span>}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--ee-muted)] max-w-2xl leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
