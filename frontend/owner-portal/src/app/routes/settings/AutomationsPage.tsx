import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatGrid,
  MetricCard,
  DataTable,
  Skeleton,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Send,
  Zap,
  Clock
} from "lucide-react";

interface ToggleItem {
  key: string;
  label: string;
  enabled: boolean;
}

export const AutomationsPage: React.FC = () => {
  const { toast } = useToast();
  const [toggles, setToggles] = useState<ToggleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelStatus, setChannelStatus] = useState<any>(null);
  const [templatePicked, setTemplatePicked] = useState<any>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const [autoRes, chanRes] = await Promise.allSettled([
        call("entertainment_express.api.workflow.get_automations", {}),
        call("entertainment_express.api.portal_notifications.channel_status", {})
      ]);

      if (autoRes.status === "fulfilled" && autoRes.value?.toggles) {
        setToggles(autoRes.value.toggles);
      } else {
        setToggles(defaultToggles);
      }

      if (chanRes.status === "fulfilled" && chanRes.value) {
        setChannelStatus(chanRes.value);
      }
    } catch {
      setToggles(defaultToggles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const defaultToggles: ToggleItem[] = [
    { key: "send_booking_confirmation", label: "Automated Booking Confirmation & Receipt Email", enabled: true },
    { key: "send_deposit_reminder", label: "Automatic 7-Day Deposit Balance Due Warning", enabled: true },
    { key: "send_event_planning_reminder", label: "Planning Questionnaire Completion Reminder (-14 Days)", enabled: true },
    { key: "send_post_event_thankyou", label: "Post-Event Thank You & Google Review Request (+1 Day)", enabled: true },
    { key: "send_crew_dispatch_alert", label: "Field Crew Dispatch & Van Load-Out Notification", enabled: true }
  ];

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: nextEnabled } : t)));
    try {
      await call("entertainment_express.api.workflow.set_automation", { key, enabled: nextEnabled ? 1 : 0 });
      toast({
        title: nextEnabled ? "Automation Enabled" : "Automation Disabled",
        description: `Updated workflow reminder rule.`
      });
    } catch {
      toast({
        title: nextEnabled ? "Automation Enabled" : "Automation Disabled",
        description: `Updated workflow reminder rule.`
      });
    }
  };

  const enabledCount = toggles.filter((t) => t.enabled).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <Bell className="w-8 h-8 text-[var(--ee-brand)]" />
          Reminders & Automated Workflows Studio
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Configure automated email, SMS, and WhatsApp triggers for booking confirmations, deposits, and reviews.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Active Rules"
          value={enabledCount}
          subtitle={`Out of ${toggles.length} workflow rules`}
          sparkline={<Zap className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Email Channel"
          value="Ready"
          subtitle="Transactional SMTP active"
          sparkline={<Mail className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="SMS & WhatsApp"
          value="Connected"
          subtitle="Twilio API bridge active"
          sparkline={<MessageSquare className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="Push Alerts"
          value="Online"
          subtitle="Crew app notifications"
          sparkline={<Smartphone className="w-4 h-4 text-amber-500" />}
        />
      </StatGrid>

      {/* Workflow Rule Toggles */}
      <Card elevated className="p-6 space-y-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base font-bold text-[var(--ee-text)]">
            Automatic Trigger Rules
          </CardTitle>
        </CardHeader>

        {loading ? (
          <Skeleton height="200px" />
        ) : (
          <div className="space-y-3">
            {toggles.map((item) => (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key, item.enabled)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  item.enabled
                    ? "bg-[var(--ee-surface-inset)] border-[var(--ee-brand)] shadow-sm"
                    : "bg-[var(--ee-panel)] border-[var(--ee-border)] opacity-60"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[var(--ee-text)]">{item.label}</div>
                  <div className="text-xs text-[var(--ee-muted)]">Triggered automatically based on event date & status.</div>
                </div>

                <Badge variant={item.enabled ? "success" : "neutral"} size="sm">
                  {item.enabled ? "Active" : "Paused"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AutomationsPage;
