import React, { useState } from "react";
import { Dialog } from "../src/primitives/Dialog";
import { Sheet } from "../src/primitives/Sheet";
import { DropdownMenu } from "../src/primitives/DropdownMenu";
import { Tabs } from "../src/primitives/Tabs";
import { Tooltip } from "../src/primitives/Tooltip";
import { Popover } from "../src/primitives/Popover";
import { Avatar } from "../src/primitives/Avatar";
import { Progress } from "../src/primitives/Progress";
import { Alert } from "../src/primitives/Alert";
import { Button } from "../src/primitives/Button";
import { MoreHorizontal, FileText, Trash, Edit, CheckCircle } from "lucide-react";

export default {
  title: "Primitives/Overlays & Feedback",
};

export const Overlays = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="p-8 max-w-4xl space-y-8 font-body">
      <div>
        <h2 className="text-2xl font-bold mb-1">Overlay Primitives (2.2)</h2>
        <p className="text-sm text-[var(--ee-muted)]">
          Dialog (focus trapping), Sheet (slide-over), DropdownMenu, Tabs, Tooltip, Popover
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trigger={<Button variant="primary">Open Dialog</Button>}
          title="Confirm Booking Dispatch"
          description="Are you sure you want to dispatch talent to this event? Crew notifications will be queued."
        >
          <div className="py-4 space-y-3">
            <p className="text-sm text-[var(--ee-text)]">
              Primary DJ: Marcus Vance ($450.00)<br />
              Venue: Grand Ballroom, San Jose
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ee-border-subtle)]">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>Confirm & Dispatch</Button>
          </div>
        </Dialog>

        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          trigger={<Button variant="secondary">Open Slide Sheet</Button>}
          title="Booking Details: #EV-2026-89"
          description="Event inspection drawer with live sync."
        >
          <div className="py-4 space-y-4">
            <div className="p-4 bg-[var(--ee-surface-inset)] rounded-lg text-sm">
              <span className="font-semibold block">Client: Sarah Jenkins</span>
              <span className="text-[var(--ee-muted)]">Wedding Reception (4 Hours)</span>
            </div>
            <Progress value={65} variant="brand" />
            <span className="text-xs text-[var(--ee-muted)]">65% Planning Questions Completed</span>
          </div>
        </Sheet>

        <DropdownMenu
          trigger={<Button variant="outline" rightIcon={<MoreHorizontal className="w-4 h-4" />}>Row Actions</Button>}
          items={[
            { key: "view", label: "View Contract", icon: <FileText /> },
            { key: "edit", label: "Edit Booking", icon: <Edit /> },
            { key: "del", label: "Cancel Job", icon: <Trash />, destructive: true, separatorBefore: true },
          ]}
        />

        <Tooltip content="Requires 2 staff members with heavy lift cert">
          <Button variant="ghost">Hover for Tooltip</Button>
        </Tooltip>

        <Popover
          trigger={<Button variant="ghost">Open Popover</Button>}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Quick Staff Filter</h4>
            <p className="text-xs text-[var(--ee-muted)]">Select active talent pool for today's run sheets.</p>
          </div>
        </Popover>
      </div>

      {/* Tabs & Avatars */}
      <div className="p-6 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm space-y-6">
        <h3 className="font-semibold text-sm">Tabs & Avatars</h3>
        <div className="flex items-center gap-3">
          <Avatar fallback="TR" size="sm" />
          <Avatar fallback="MV" size="md" />
          <Avatar fallback="SJ" size="lg" />
          <Avatar fallback="EE" size="xl" />
        </div>

        <Tabs
          tabs={[
            { id: "overview", label: "Overview", content: <div className="p-4 bg-[var(--ee-surface-inset)] rounded-lg text-sm">Overview Tab Content</div> },
            { id: "documents", label: "Contracts & Documents", content: <div className="p-4 bg-[var(--ee-surface-inset)] rounded-lg text-sm">Documents Tab Content</div> },
            { id: "payments", label: "Payment Schedule", badge: <span className="bg-[var(--ee-brand-soft)] text-[var(--ee-brand)] px-1.5 py-0.5 rounded text-xs font-semibold">Due</span>, content: <div className="p-4 bg-[var(--ee-surface-inset)] rounded-lg text-sm">Payments Tab Content</div> },
          ]}
        />
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <Alert variant="info" title="System Notice">
          Portal running in Cockpit density mode. Changes sync across all authenticated tenants.
        </Alert>
        <Alert variant="warning" title="Dispatch At Risk">
          2 events scheduled today are missing assigned lead drivers.
        </Alert>
        <Alert variant="danger" title="Payment Overdue">
          Invoice #INV-2026-44 is 5 days past due date.
        </Alert>
        <Alert variant="success" title="Proposal Signed">
          Client e-signed the master services agreement.
        </Alert>
      </div>
    </div>
  );
};
