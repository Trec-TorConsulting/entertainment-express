import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Circle } from "lucide-react";
import { clsx } from "clsx";

export type TimelineItemStatus = "completed" | "current" | "pending" | "at-risk";

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  time?: string;
  description?: React.ReactNode;
  status?: TimelineItemStatus;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusIcons: Record<TimelineItemStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />,
  current: <Clock className="w-4 h-4 text-[var(--ee-brand)] animate-pulse" />,
  "at-risk": <AlertTriangle className="w-4 h-4 text-[var(--ee-warning)]" />,
  pending: <Circle className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
};

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={clsx("relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--ee-border)]", className)}>
      {items.map((item, idx) => {
        const status = item.status || "pending";
        const isLast = idx === items.length - 1;

        return (
          <div key={item.id} className="relative flex items-start gap-3 text-sm">
            {/* Status node */}
            <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ee-surface-raised)] ring-4 ring-[var(--ee-surface-raised)]">
              {item.icon || statusIcons[status]}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-[var(--ee-text)]">
                  {item.title}
                </div>
                <div className="flex items-center gap-2">
                  {item.badge}
                  {item.time && (
                    <span className="text-xs font-mono text-[var(--ee-muted)] tabular-nums">
                      {item.time}
                    </span>
                  )}
                </div>
              </div>
              {item.description && (
                <div className="text-xs text-[var(--ee-muted)] leading-relaxed">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
