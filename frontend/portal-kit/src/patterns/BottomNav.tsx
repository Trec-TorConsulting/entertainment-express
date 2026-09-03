import React from "react";
import { clsx } from "clsx";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, className }) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className={clsx(
        "fixed bottom-0 inset-x-0 z-[var(--ee-z-sticky)] h-[var(--ee-bottom-nav-height)] border-t border-[var(--ee-border)] bg-[var(--ee-surface-raised)]/95 backdrop-blur-md px-2 flex items-center justify-around shadow-ee-lg md:hidden",
        className
      )}
    >
      {items.map((item) => {
        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={clsx(
              "relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 transition-colors select-none focus-visible:outline-none",
              item.active
                ? "text-[var(--ee-brand)] font-semibold"
                : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
            )}
          >
            <div className="relative">
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              {item.badge && (
                <span className="absolute -top-1.5 -right-2 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
