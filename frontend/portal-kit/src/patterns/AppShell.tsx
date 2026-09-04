import React, { useState, useEffect } from "react";
import {
  Menu, ChevronLeft, ChevronRight, Search, Sun, Moon,
  LayoutDashboard, Sparkles, DollarSign, MoreHorizontal, X
} from "lucide-react";
import { clsx } from "clsx";
import { getSessionBootstrap } from "../api/session";
import { ToastProvider } from "../primitives/Toast";
import { ThemeProvider, useTheme } from "../primitives/ThemeProvider";
import { CommandPalette, toggleGlobalCommandPalette } from "./CommandPalette";
import { AccountMenu, InboxMenu } from "../components/AccountMenu";
import { Sheet } from "../primitives/Sheet";

export type ShellDensity = "ops" | "cockpit" | "consumer";

export interface AppShellProps {
  title: string;
  portal: "owner" | "employee" | "client";
  density?: ShellDensity;
  sidebar?: React.ReactNode;
  bottom?: React.ReactNode;
  headerExtra?: React.ReactNode;
  showSearch?: boolean;
  children: React.ReactNode;
}

const LINKS = {
  owner: { account: "/owner/account", settings: "/owner/brand" },
  employee: { account: "/employee/me", settings: undefined as string | undefined },
  client: { account: "/client/account", settings: undefined as string | undefined },
};

function ShellHeaderActions({
  headerExtra,
  links,
  showSearch = true
}: {
  headerExtra?: React.ReactNode;
  links: { account: string; settings?: string };
  showSearch?: boolean;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {showSearch && (
        <button
          type="button"
          onClick={toggleGlobalCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-xs text-[var(--ee-muted)] hover:border-[var(--ee-border-strong)] transition-colors"
          aria-label="Search and command palette"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded border bg-[var(--ee-surface-raised)] font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      )}

      {headerExtra}

      <button
        type="button"
        onClick={toggleTheme}
        className="p-1.5 rounded-lg border border-[var(--ee-border)] text-[var(--ee-muted)] hover:text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-colors"
        aria-label="Toggle dark mode"
      >
        {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <InboxMenu />
      <AccountMenu accountHref={links.account} settingsHref={links.settings} />
    </div>
  );
}

export const AppShell: React.FC<AppShellProps> = ({
  title,
  portal,
  density = "cockpit",
  sidebar,
  bottom,
  headerExtra,
  showSearch = true,
  children
}) => {
  const bootstrap = getSessionBootstrap();
  const branding = bootstrap.branding;
  const brandColor = branding?.color;
  const company = branding?.name || title;
  const hideProduct = Boolean(branding?.hide_product_chrome);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ee-sidebar-collapsed") === "true";
    }
    return false;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("ee-sidebar-collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    // Clear any potential inline styles on documentElement that override theme tokens
    document.documentElement.style.removeProperty("--ee-brand");
    document.documentElement.style.removeProperty("--ee-brand-2");
    document.documentElement.style.removeProperty("--ee-brand-text");
    document.documentElement.style.removeProperty("--ee-accent");
    document.documentElement.style.removeProperty("--ee-bg");
    document.documentElement.style.removeProperty("--ee-text");

    // Inject branding CSS variables scoped to :root:not([data-theme="dark"])
    // so custom tenant light-theme branding never destroys dark mode high-contrast text
    let styleEl = document.getElementById("ee-branding-theme") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "ee-branding-theme";
      document.head.appendChild(styleEl);
    }

    const lightRules: string[] = [];
    if (brandColor) {
      lightRules.push(`--ee-brand: ${brandColor};`, `--ee-brand-text: ${brandColor};`);
    }
    if (branding?.color_secondary) {
      lightRules.push(`--ee-brand-2: ${branding.color_secondary};`);
    }
    if (branding?.color_accent) {
      lightRules.push(`--ee-accent: ${branding.color_accent};`);
    }
    if (branding?.color_bg) {
      lightRules.push(`--ee-bg: ${branding.color_bg};`);
    }
    if (branding?.color_text) {
      lightRules.push(`--ee-text: ${branding.color_text};`);
    }

    styleEl.textContent = lightRules.length ? `:root:not([data-theme="dark"]) { ${lightRules.join(" ")} }` : "";
    if (branding?.favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.favicon;
    }
    document.title = hideProduct ? company : `${company} · ${title}`;
    document.documentElement.classList.toggle("ee-hide-product", hideProduct);
  }, [
    brandColor,
    branding?.color_secondary,
    branding?.color_accent,
    branding?.color_bg,
    branding?.color_text,
    branding?.favicon,
    company,
    hideProduct,
    title,
  ]);

  const densityClass =
    density === "ops"
      ? "density-ops"
      : density === "consumer"
      ? "density-consumer"
      : "density-cockpit";

  const links = LINKS[portal];

  // Default owner bottom navigation if none passed
  const defaultOwnerBottom = portal === "owner" && !bottom ? (
    <nav
      aria-label="Owner Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-[var(--ee-z-sticky)] h-[var(--ee-bottom-nav-height)] border-t border-[var(--ee-border)] bg-[var(--ee-surface-raised)]/95 backdrop-blur-md px-2 flex items-center justify-around shadow-ee-lg md:hidden"
    >
      <a
        href="/owner"
        className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 text-[var(--ee-muted)] hover:text-[var(--ee-brand)] transition-colors"
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Today</span>
      </a>
      <a
        href="/owner/pipeline"
        className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 text-[var(--ee-muted)] hover:text-[var(--ee-brand)] transition-colors"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px] font-medium">Pipeline</span>
      </a>
      <a
        href="/owner/money"
        className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 text-[var(--ee-muted)] hover:text-[var(--ee-brand)] transition-colors"
      >
        <DollarSign className="w-5 h-5" />
        <span className="text-[10px] font-medium">Money</span>
      </a>
      <button
        type="button"
        onClick={() => setMobileDrawerOpen(true)}
        className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] gap-1 text-[var(--ee-muted)] hover:text-[var(--ee-brand)] transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  ) : null;

  const resolvedBottom = bottom || defaultOwnerBottom;

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className={clsx("min-h-screen flex flex-col md:flex-row bg-[var(--ee-bg)] text-[var(--ee-text)]", densityClass)}>
          {/* Skip to Content accessible link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--ee-z-tooltip)] focus:p-3 focus:rounded-md focus:bg-[var(--ee-brand)] focus:text-white focus:shadow-lg"
          >
            Skip to main content
          </a>

          {/* Desktop Rail (Hidden on mobile) */}
          <aside
            aria-label="Primary Navigation"
            className={clsx(
              "hidden md:flex flex-col shrink-0 bg-[var(--ee-rail)] text-[var(--ee-rail-text)] transition-all duration-200 border-r border-[var(--ee-rail-hover)] select-none",
              collapsed ? "w-16 p-2" : "w-64 p-3.5"
            )}
          >
            {/* Brand Logo & Title */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ee-rail-hover)] mb-2">
              <a href={`/${portal}`} className="flex items-center gap-2.5 overflow-hidden">
                {branding?.logo ? (
                  <img src={branding.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-lg bg-[var(--ee-brand)] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {(company || "EE").slice(0, 2).toUpperCase()}
                  </span>
                )}
                {!collapsed && (
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-sm leading-tight text-white truncate">{company}</span>
                    {!hideProduct && <span className="text-[10px] text-[var(--ee-rail-muted)]">{title}</span>}
                  </div>
                )}
              </a>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
              {sidebar}
            </div>

            {/* Rail collapse toggle */}
            <div className="pt-2 border-t border-[var(--ee-rail-hover)] mt-auto">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-[var(--ee-rail-muted)] hover:text-white hover:bg-[var(--ee-rail-hover)] transition-colors cursor-pointer"
                aria-label={collapsed ? "Expand sidebar rail" : "Collapse sidebar rail"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : (
                  <>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Collapse sidebar</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Mobile Sheet Drawer */}
          <Sheet
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
            side="left"
            className="w-72 p-4 bg-[var(--ee-rail)] text-[var(--ee-rail-text)] border-r border-[var(--ee-rail-hover)] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ee-rail-hover)] mb-3">
              <span className="font-bold text-white text-base">{company}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </Sheet>

          {/* Main workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="h-14 px-4 sm:px-6 border-b border-[var(--ee-border)] bg-[var(--ee-surface-raised)] flex items-center justify-between gap-3 sticky top-0 z-[var(--ee-z-sticky)]">
              {/* Mobile hamburger button */}
              <div className="flex items-center gap-2.5 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="p-2 rounded-lg border border-[var(--ee-border)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)]"
                  aria-label="Open mobile navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm tracking-tight truncate max-w-[150px]">{company}</span>
              </div>

              {/* Desktop header spacer or custom title */}
              <div className="hidden md:block">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
                  {title}
                </span>
              </div>

              {/* Header actions */}
              <ShellHeaderActions
                headerExtra={headerExtra}
                links={links}
                showSearch={showSearch}
              />
            </header>

            {/* Main Content Area */}
            <main
              id="main-content"
              tabIndex={-1}
              className={clsx(
                "flex-1 p-4 sm:p-6 lg:p-8 outline-none",
                resolvedBottom ? "pb-20 md:pb-8" : ""
              )}
            >
              {children}
            </main>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          {resolvedBottom}

          {/* Global Command Palette */}
          <CommandPalette portal={portal} />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};
