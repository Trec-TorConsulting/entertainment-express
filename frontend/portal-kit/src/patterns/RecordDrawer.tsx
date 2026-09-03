import React from "react";
import { Sheet } from "../primitives/Sheet";
import { clsx } from "clsx";

export interface RecordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  children,
  footer
}) => {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      className="flex flex-col h-full w-full sm:max-w-xl p-0 gap-0"
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--ee-border)] bg-[var(--ee-surface-raised)] space-y-1.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-[var(--ee-text)]">
            {title}
          </h2>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--ee-muted)] leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {children}
      </div>

      {/* Sticky footer actions */}
      {footer && (
        <div className="p-4 border-t border-[var(--ee-border)] bg-[var(--ee-surface-raised)] flex items-center justify-between gap-3 shrink-0">
          {footer}
        </div>
      )}
    </Sheet>
  );
};
