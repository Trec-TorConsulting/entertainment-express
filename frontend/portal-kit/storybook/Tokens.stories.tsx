import React from "react";

export default {
  title: "Design System/Tokens",
};

export const AllTokens = () => {
  return (
    <div className="p-8 space-y-12 max-w-5xl mx-auto font-body text-[var(--ee-text)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Entertainment Express Design Tokens</h1>
        <p className="text-[var(--ee-muted)] text-base">
          Source of truth defined in <code className="bg-[var(--ee-surface-inset)] px-1.5 py-0.5 rounded text-sm">tokens.css</code> and mirrored in Tailwind preset.
        </p>
      </div>

      {/* Surface Levels */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[var(--ee-border)] pb-2">Surfaces & Panels</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-base)] shadow-sm">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">--ee-surface-base</span>
            <span className="font-medium text-sm">Base Surface</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-sm">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">--ee-surface-raised</span>
            <span className="font-medium text-sm">Raised Surface</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-overlay)] shadow-md">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">--ee-surface-overlay</span>
            <span className="font-medium text-sm">Overlay Surface</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">--ee-surface-inset</span>
            <span className="font-medium text-sm">Inset / Wells</span>
          </div>
        </div>
      </section>

      {/* Brand & Status Colors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[var(--ee-border)] pb-2">Brand & Status Semantics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg border border-[var(--ee-brand-border)] bg-[var(--ee-brand-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ee-brand)] mb-2" />
            <span className="text-xs font-mono text-[var(--ee-brand-text)] block">Brand</span>
            <span className="text-xs text-[var(--ee-muted)]">--ee-brand</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-success-border)] bg-[var(--ee-success-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ee-success)] mb-2" />
            <span className="text-xs font-mono text-[var(--ee-success-text)] block">Success</span>
            <span className="text-xs text-[var(--ee-muted)]">--ee-success</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-warning-border)] bg-[var(--ee-warning-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ee-warning)] mb-2" />
            <span className="text-xs font-mono text-[var(--ee-warning-text)] block">Warning</span>
            <span className="text-xs text-[var(--ee-muted)]">--ee-warning</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-danger-border)] bg-[var(--ee-danger-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ee-danger)] mb-2" />
            <span className="text-xs font-mono text-[var(--ee-danger-text)] block">Danger</span>
            <span className="text-xs text-[var(--ee-muted)]">--ee-danger</span>
          </div>
          <div className="p-4 rounded-lg border border-[var(--ee-info-border)] bg-[var(--ee-info-soft)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ee-info)] mb-2" />
            <span className="text-xs font-mono text-[var(--ee-info-text)] block">Info</span>
            <span className="text-xs text-[var(--ee-muted)]">--ee-info</span>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[var(--ee-border)] pb-2">Type Scale</h2>
        <div className="space-y-3 bg-[var(--ee-surface-raised)] p-6 rounded-xl border border-[var(--ee-border)]">
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Display (2rem / 32px)</span>
            <span className="text-ee-display font-display">Entertainment Operations at Scale</span>
          </div>
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Title (1.5rem / 24px)</span>
            <span className="text-ee-title">Summer Music Festival & Production</span>
          </div>
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Heading (1.125rem / 18px)</span>
            <span className="text-ee-heading">Assigned Talent & Equipment Rigs</span>
          </div>
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Body (0.875rem / 14px)</span>
            <span className="text-ee-body">Standard operational body text configured for density across mobile dispatch, customer invoices, and owner cockpit viewports.</span>
          </div>
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Label (0.8125rem / 13px)</span>
            <span className="text-ee-label uppercase tracking-wider">Status: Deposit Paid</span>
          </div>
          <div className="pb-3 border-b border-[var(--ee-border-subtle)]">
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Caption (0.75rem / 12px)</span>
            <span className="text-ee-caption text-[var(--ee-muted)]">Last synced 2 minutes ago via Traefik ingress</span>
          </div>
          <div>
            <span className="text-xs font-mono text-[var(--ee-muted)] block mb-1">Mono (Tabular figures)</span>
            <span className="font-mono tabular-nums text-sm">$14,850.00 USD • INV-2026-0903</span>
          </div>
        </div>
      </section>

      {/* Elevation & Shadows */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[var(--ee-border)] pb-2">Elevation & Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 bg-[var(--ee-surface-raised)] rounded-lg shadow-ee-sm border border-[var(--ee-border)]">
            <span className="text-xs font-mono text-[var(--ee-muted)]">--ee-shadow-sm</span>
          </div>
          <div className="p-6 bg-[var(--ee-surface-raised)] rounded-lg shadow-ee border border-[var(--ee-border)]">
            <span className="text-xs font-mono text-[var(--ee-muted)]">--ee-shadow-md</span>
          </div>
          <div className="p-6 bg-[var(--ee-surface-raised)] rounded-lg shadow-ee-lg border border-[var(--ee-border)]">
            <span className="text-xs font-mono text-[var(--ee-muted)]">--ee-shadow-lg</span>
          </div>
          <div className="p-6 bg-[var(--ee-surface-raised)] rounded-lg shadow-ee-xl border border-[var(--ee-border)]">
            <span className="text-xs font-mono text-[var(--ee-muted)]">--ee-shadow-xl</span>
          </div>
        </div>
      </section>

      {/* Radii & Motion */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-[var(--ee-border)] pb-2">Radii & Motion</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-[var(--ee-radius-sm)] text-center text-xs">
            sm (6px)
          </div>
          <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-[var(--ee-radius-md)] text-center text-xs">
            md (10px)
          </div>
          <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-[var(--ee-radius-lg)] text-center text-xs">
            lg (14px)
          </div>
          <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-[var(--ee-radius-xl)] text-center text-xs">
            xl (18px)
          </div>
          <div className="p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-full text-center text-xs">
            full (9999px)
          </div>
        </div>
      </section>
    </div>
  );
};
