import React, { useState } from "react";
import { Button } from "../src/primitives/Button";
import { IconButton } from "../src/primitives/IconButton";
import { Input } from "../src/primitives/Input";
import { Textarea } from "../src/primitives/Textarea";
import { Select } from "../src/primitives/Select";
import { Checkbox } from "../src/primitives/Checkbox";
import { Switch } from "../src/primitives/Switch";
import { Badge } from "../src/primitives/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../src/primitives/Card";
import { Search, Plus, Calendar } from "lucide-react";

export default {
  title: "Primitives/Form & Display",
};

export const InputAndControls = () => {
  const [selectVal, setSelectVal] = useState("option1");
  const [checked, setChecked] = useState<boolean | "indeterminate">(true);
  const [switchOn, setSwitchOn] = useState(false);

  return (
    <div className="p-8 max-w-3xl space-y-8 font-body">
      <div>
        <h2 className="text-2xl font-bold mb-1">Component Primitives (2.1)</h2>
        <p className="text-sm text-[var(--ee-muted)]">
          Input, Textarea, Select, Checkbox, Switch, Badge, Card, IconButton
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4 p-5 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
          <h3 className="font-semibold text-sm">Inputs</h3>
          <div>
            <label className="text-xs text-[var(--ee-muted)] block mb-1">Default with icon</label>
            <Input placeholder="Search bookings..." leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <div>
            <label className="text-xs text-[var(--ee-muted)] block mb-1">Focus & Error state</label>
            <Input defaultValue="invalid_host_address" error="Invalid host URL provided" />
            <span className="text-xs text-[var(--ee-danger)] mt-1 block">Invalid host URL provided</span>
          </div>
          <div>
            <label className="text-xs text-[var(--ee-muted)] block mb-1">Disabled</label>
            <Input disabled value="Readonly API key" />
          </div>
        </div>

        {/* Textarea & Select */}
        <div className="space-y-4 p-5 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
          <h3 className="font-semibold text-sm">Select & Textarea</h3>
          <div>
            <label className="text-xs text-[var(--ee-muted)] block mb-1">Select dropdown</label>
            <Select
              value={selectVal}
              onValueChange={setSelectVal}
              options={[
                { value: "option1", label: "DJ & Sound Production" },
                { value: "option2", label: "360 Video Booth Unit" },
                { value: "option3", label: "Bounce House Deluxe" },
              ]}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--ee-muted)] block mb-1">Textarea</label>
            <Textarea placeholder="Enter event notes or load-in details..." rows={3} />
          </div>
        </div>

        {/* Toggles & Badges */}
        <div className="space-y-4 p-5 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
          <h3 className="font-semibold text-sm">Toggles & Badges</h3>
          <div className="flex items-center gap-6">
            <Checkbox
              id="c1"
              label="Deposit paid"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <Switch
              id="s1"
              label="Auto-dispatch"
              checked={switchOn}
              onCheckedChange={setSwitchOn}
            />
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Badge variant="brand" dot>Confirmed</Badge>
            <Badge variant="success">Paid $2,400</Badge>
            <Badge variant="warning">At Risk</Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="info">In Review</Badge>
          </div>
        </div>

        {/* IconButton */}
        <div className="space-y-4 p-5 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl shadow-sm">
          <h3 className="font-semibold text-sm">IconButtons</h3>
          <div className="flex items-center gap-3">
            <IconButton icon={<Search className="w-4 h-4" />} aria-label="Search" variant="secondary" />
            <IconButton icon={<Plus className="w-4 h-4" />} aria-label="Add" variant="primary" />
            <IconButton icon={<Calendar className="w-4 h-4" />} aria-label="Date" variant="outline" />
            <IconButton icon={<Plus className="w-4 h-4" />} aria-label="Loading" variant="secondary" loading />
            <IconButton icon={<Search className="w-4 h-4" />} aria-label="Disabled" variant="ghost" disabled />
          </div>
        </div>
      </div>

      {/* Card example */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Summer Gala 2026</CardTitle>
          <CardDescription>Grand Plaza Ballroom • Sept 12, 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Assigned crew: Lead DJ Marcus + Attendant Sarah. Staging begins at 14:00.</p>
        </CardContent>
        <CardFooter>
          <span className="text-xs text-[var(--ee-muted)]">Run sheet approved</span>
          <Button density="cockpit" variant="outline">View Run Sheet</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
