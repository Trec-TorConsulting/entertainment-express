import React, { useState } from "react";
import {
  PageHeader,
  DispatchBoard,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Sheet,
  useToast,
  getSessionBootstrap
} from "@portal-kit";
import {
  Truck, Users, Sparkles, Filter, ChevronRight,
  UserCheck, ShieldCheck, X
} from "lucide-react";

export const DispatchEmbedPage: React.FC = () => {
  const { toast } = useToast();
  const roles = getSessionBootstrap().roles || [];
  const canAssign = roles.includes("EE Dispatcher");

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; role: string; event: string; callTime: string } | null>(null);

  // Suggested talent pool mock/sample for 1-tap quick assignment
  const talentPool = [
    { id: "crew-1", name: "Alex Rivera", role: "Lead Audio Tech", status: "Available", rating: "5.0", match: "98%" },
    { id: "crew-2", name: "Marcus Chen", role: "Lighting Tech", status: "Available", rating: "4.9", match: "94%" },
    { id: "crew-3", name: "Samira Patel", role: "DJ / Host", status: "Available", rating: "4.8", match: "89%" },
  ];

  const handleAssign = (talent: typeof talentPool[0]) => {
    toast({
      title: "Crew Assigned",
      description: `${talent.name} assigned to ${selectedRole?.role || "shift"}. Shift notification dispatched.`,
      variant: "success"
    });
    setInspectorOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Fleet & Crew Dispatch Grid"
        subtitle="Live roster assignments, venue staging schedules, and equipment vehicle dispatch."
        badge={
          <Badge variant="brand" size="sm">
            Live Dispatch Rail
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              density="ops"
              onClick={() => {
                setSelectedRole({
                  id: "open-role-1",
                  role: "Audio Lead A1",
                  event: "Riverside Summer Gala",
                  callTime: "16:00"
                });
                setInspectorOpen(true);
              }}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Recommend Crew
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Timeline Grid (Left 8 or 9 cols on desktop) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] shadow-sm">
            <DispatchBoard canAssign={canAssign} />
          </div>
        </div>

        {/* Desktop Inspector Rail (Right 4 or 3 cols) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4">
          <Card elevated>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--ee-brand)]" />
                  Talent Recommendations
                </span>
                <Badge variant="success" size="sm">Smart Match</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--ee-muted)]">
                AI crew matching scores based on equipment skills, proximity, and availability.
              </p>

              {talentPool.map((talent) => (
                <div
                  key={talent.id}
                  className="p-3 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-[var(--ee-text)]">
                    <span>{talent.name}</span>
                    <span className="font-mono text-[var(--ee-brand)] font-bold">{talent.match} Match</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--ee-muted)]">
                    <span>{talent.role}</span>
                    <span>★ {talent.rating}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(talent)}
                    className="w-full h-10 min-h-[40px] px-3 rounded-lg bg-[var(--ee-brand)] hover:opacity-90 text-white font-semibold flex items-center justify-center gap-1.5 transition-opacity"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    1-Tap Assign
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Drawer / Bottom Sheet Inspector for Screens < 768px */}
      <Sheet
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        side="bottom"
        title={selectedRole ? `Assign Crew: ${selectedRole.role}` : "Talent Inspector"}
        description={selectedRole ? `${selectedRole.event} • Call Time ${selectedRole.callTime}` : undefined}
      >
        <div className="space-y-4 pt-2">
          {talentPool.map((talent) => (
            <div
              key={talent.id}
              className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-base)] space-y-3 text-xs"
            >
              <div className="flex items-center justify-between font-bold text-sm text-[var(--ee-text)]">
                <span>{talent.name}</span>
                <span className="font-mono text-[var(--ee-brand)]">{talent.match} Match</span>
              </div>
              <div className="flex justify-between text-[var(--ee-muted)]">
                <span>{talent.role}</span>
                <span>Rating: ★ {talent.rating}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAssign(talent)}
                className="w-full h-12 min-h-[48px] rounded-xl bg-[var(--ee-brand)] text-white font-bold flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Assign to Shift
              </button>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
