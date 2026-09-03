import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Search, LayoutDashboard, DollarSign, Sparkles, Truck,
  Palette, Sun, Moon, Plus, ArrowRight, Calendar, FileText
} from "lucide-react";
import { clsx } from "clsx";
import { useTheme } from "../primitives/ThemeProvider";

export interface CommandItemDef {
  id: string;
  label: string;
  keywords?: string[];
  icon?: React.ReactNode;
  onSelect: () => void;
  group?: string;
  shortcut?: string;
}

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items?: CommandItemDef[];
  onNavigate?: (path: string) => void;
  portal?: "owner" | "employee" | "client";
}

let globalOpenFn: ((open: boolean) => void) | null = null;

export function toggleGlobalCommandPalette() {
  globalOpenFn?.(true);
}

export function focusCommandPalette() {
  globalOpenFn?.(true);
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open: controlledOpen,
  onOpenChange,
  items,
  onNavigate,
  portal = "owner"
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const { toggleTheme } = useTheme();

  useEffect(() => {
    globalOpenFn = (val: boolean) => setOpen(val);
    return () => {
      globalOpenFn = null;
    };
  }, [setOpen]);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  // Default routes and actions per portal
  const defaultItems: CommandItemDef[] = items || [
    // Navigation routes
    {
      id: "nav-today",
      label: "Today Cockpit",
      keywords: ["today", "home", "dashboard"],
      icon: <LayoutDashboard className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.(portal === "owner" ? "/owner" : portal === "employee" ? "/employee" : "/client");
      }
    },
    {
      id: "nav-money",
      label: "Money & Invoices",
      keywords: ["money", "invoices", "payments", "revenue", "holds", "payouts", "billing"],
      icon: <DollarSign className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.(portal === "client" ? "/client/pay" : "/owner/money");
      }
    },
    {
      id: "nav-pipeline",
      label: "Inquiries & Pipeline",
      keywords: ["pipeline", "leads", "inquiries", "quotes", "proposals", "deals"],
      icon: <Sparkles className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.("/owner/pipeline");
      }
    },
    {
      id: "nav-dispatch",
      label: "Dispatch Board",
      keywords: ["dispatch", "schedule", "crew", "trucks", "assignments"],
      icon: <Truck className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.(portal === "employee" ? "/employee/dispatch" : "/owner/dispatch");
      }
    },
    {
      id: "nav-brand",
      label: "Brand White-Label",
      keywords: ["brand", "white-label", "logo", "colors", "domain", "theme"],
      icon: <Palette className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.("/owner/brand");
      }
    },
    {
      id: "nav-calendar",
      label: "Event Calendar",
      keywords: ["calendar", "events", "bookings", "schedule"],
      icon: <Calendar className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => {
        onNavigate?.(portal === "client" ? "/client/events" : "/owner/calendar");
      }
    },
    // Quick Actions
    {
      id: "act-new-inquiry",
      label: "Create New Inquiry",
      keywords: ["new", "create", "lead", "booking"],
      icon: <Plus className="w-4 h-4 text-[var(--ee-brand)]" />,
      group: "Actions",
      onSelect: () => {
        onNavigate?.("/owner/pipeline?action=new");
      }
    },
    {
      id: "act-toggle-theme",
      label: "Toggle Dark / Light Mode",
      keywords: ["theme", "dark", "light", "mode", "color"],
      icon: <Sun className="w-4 h-4" />,
      group: "Actions",
      onSelect: () => {
        toggleTheme();
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--ee-z-modal)] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-[var(--ee-radius-xl)] border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-ee-xl animate-in zoom-in-95 duration-150 text-[var(--ee-text)]">
        <Command
          className="w-full flex flex-col"
          loop
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--ee-border)]">
            <Search className="w-4 h-4 text-[var(--ee-muted)] shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search (e.g. 'Money', 'Pipeline')..."
              className="w-full bg-transparent text-sm placeholder:text-[var(--ee-muted)] focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[10px] font-mono text-[var(--ee-muted)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-2">
            <Command.Empty className="p-6 text-center text-sm text-[var(--ee-muted)]">
              No matching commands or routes found.
            </Command.Empty>

            {/* Groups */}
            {["Navigation", "Actions"].map((groupName) => {
              const groupItems = defaultItems.filter((i) => (i.group || "Navigation") === groupName);
              if (groupItems.length === 0) return null;

              return (
                <Command.Group
                  key={groupName}
                  heading={
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
                      {groupName}
                    </div>
                  }
                  className="space-y-0.5"
                >
                  {groupItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${(item.keywords || []).join(" ")}`}
                      onSelect={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2 rounded-[var(--ee-radius-md)] text-sm cursor-pointer select-none transition-colors",
                        "data-[selected=true]:bg-[var(--ee-surface-inset)] data-[selected=true]:text-[var(--ee-brand)]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-[var(--ee-muted)] shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-medium truncate">{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--ee-muted)] opacity-0 group-data-[selected=true]:opacity-100" />
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--ee-border-subtle)] bg-[var(--ee-surface-inset)] text-[11px] text-[var(--ee-muted)]">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
            <span>⌘K Global Shortcut</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
