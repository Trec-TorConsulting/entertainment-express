import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Tooltip } from "../primitives/Tooltip";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  groups,
  collapsed = false,
  className
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((g) => {
      initial[g.id] = g.defaultOpen !== false;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <nav
      aria-label="Sidebar Navigation"
      className={clsx("flex flex-col gap-6 w-full select-none py-2", className)}
    >
      {groups.map((group) => {
        const isOpen = openGroups[group.id] !== false;

        return (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--ee-rail-muted)] hover:text-[var(--ee-rail-text)] transition-colors"
              >
                <span>{group.label}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                )}
              </button>
            )}

            {collapsed && (
              <div className="h-px bg-[var(--ee-rail-active)] my-2 mx-2" />
            )}

            {(isOpen || collapsed) && (
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const content = (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={clsx(
                        "w-full flex items-center rounded-[var(--ee-radius-md)] text-sm font-medium transition-colors cursor-pointer",
                        collapsed
                          ? "justify-center p-2.5"
                          : "justify-between px-3 py-2",
                        item.active
                          ? "bg-[var(--ee-brand)] text-white shadow-sm font-semibold"
                          : "text-[var(--ee-rail-text)] hover:bg-[var(--ee-rail-hover)] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 h-5 flex items-center justify-center shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <div className="shrink-0">{item.badge}</div>
                      )}
                    </button>
                  );

                  return (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip content={item.label} side="right">
                          {content}
                        </Tooltip>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
};
