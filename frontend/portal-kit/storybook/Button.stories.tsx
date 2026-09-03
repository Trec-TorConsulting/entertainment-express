import React from "react";
import { Button } from "../src/primitives/Button";

export default {
  title: "Primitives/Button",
  component: Button,
};

export const Densities = () => {
  return (
    <div className="p-8 space-y-8 font-body">
      <div>
        <h2 className="text-xl font-bold mb-1">Button Densities</h2>
        <p className="text-sm text-[var(--ee-muted)] mb-4">
          Cockpit (Owner), Ops (Employee/Dispatch), and Consumer (Client)
        </p>
      </div>

      <div className="flex items-end gap-4 p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono text-[var(--ee-muted)] block">density="cockpit" (32px)</span>
          <Button density="cockpit">Cockpit Action</Button>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono text-[var(--ee-muted)] block">density="ops" (38px)</span>
          <Button density="ops">Ops Action</Button>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono text-[var(--ee-muted)] block">density="consumer" (44px)</span>
          <Button density="consumer">Consumer Action</Button>
        </div>
      </div>
    </div>
  );
};

export const VariantsAndStates = () => {
  return (
    <div className="p-8 space-y-8 font-body">
      <div>
        <h2 className="text-xl font-bold mb-1">Variants & States</h2>
        <p className="text-sm text-[var(--ee-muted)] mb-4">
          Default, Disabled, Loading, and Focus Ring styles
        </p>
      </div>

      <div className="space-y-4 p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--ee-border-subtle)]">
          <Button variant="primary" loading>Saving...</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="outline" disabled>Disabled</Button>
          <Button variant="destructive" loading>Deleting...</Button>
        </div>
      </div>
    </div>
  );
};
