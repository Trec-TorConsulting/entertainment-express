import React from "react";
import { Search, X } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "../primitives/Input";

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  activeChip?: string;
  onChipSelect?: (id: string) => void;
  actions?: React.ReactNode;
  onClear?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Filter records...",
  chips = [],
  activeChip,
  onChipSelect,
  actions,
  onClear,
  className
}) => {
  const hasActiveFilters = Boolean(searchQuery || (activeChip && activeChip !== "all"));

  return (
    <div className={clsx("flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-ee-sm", className)}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {onSearchChange && (
          <div className="w-full sm:w-64">
            <Input
              density="cockpit"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={<Search className="w-3.5 h-3.5 text-[var(--ee-muted)]" />}
            />
          </div>
        )}

        {chips.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {chips.map((chip) => {
              const isActive = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onChipSelect?.(chip.id)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors select-none cursor-pointer shrink-0",
                    isActive
                      ? "bg-[var(--ee-brand)] text-white shadow-sm"
                      : "bg-[var(--ee-surface-inset)] text-[var(--ee-text-secondary)] hover:bg-[var(--ee-border)]"
                  )}
                >
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span
                      className={clsx(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                        isActive ? "bg-white/20 text-white" : "bg-[var(--ee-border)] text-[var(--ee-muted)]"
                      )}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {hasActiveFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-[var(--ee-muted)] hover:text-[var(--ee-danger)] transition-colors p-1"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
