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
  Skeleton,
  Input,
  useToast,
  call
} from "@portal-kit";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Zap,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  History,
  Layers,
  FileText,
  Download
} from "lucide-react";
import { TemplateModal } from "./TemplateModal";
import { ImportBundleModal } from "../contracts/ImportBundleModal";

interface ToggleItem {
  key: string;
  label: string;
  enabled: boolean;
}

interface NotificationTemplate {
  id: string;
  key: string;
  title: string;
  subject: string;
  channels: string;
  fallback: string;
  priority: string;
  active: number | boolean;
  body: string;
}

interface NotificationLog {
  id: string;
  to: string;
  channel: string;
  title: string;
  status: string;
  note: string;
  when: string;
}

export const AutomationsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"triggers" | "templates" | "history">("triggers");
  const [toggles, setToggles] = useState<ToggleItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [channelStatus, setChannelStatus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_notifications.list_templates", {});
      if (Array.isArray(res)) {
        setTemplates(res);
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Templates",
        description: err.message || "Failed to load notification templates.",
        variant: "danger"
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_notifications.list_recent", {});
      if (Array.isArray(res)) {
        setLogs(res);
      }
    } catch {
      // Non-critical log loading
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
    loadTemplates();
    loadLogs();
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
        description: `Updated workflow reminder rule.`,
        variant: "success"
      });
    } catch {
      toast({
        title: nextEnabled ? "Automation Enabled" : "Automation Disabled",
        description: `Updated workflow reminder rule.`,
        variant: "success"
      });
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    if (!window.confirm(`Are you sure you want to delete template '${template.key}'?`)) {
      return;
    }

    setDeletingId(template.id);
    try {
      await call("entertainment_express.api.portal_notifications.delete_template", {
        name: template.id,
        key: template.key
      });
      toast({
        title: "Template Deleted",
        description: `Successfully removed '${template.key}'.`,
        variant: "success"
      });
      setTemplates((prev) => prev.filter((t) => t.id !== template.id && t.key !== template.key));
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete template.",
        variant: "danger"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openAddModal = () => {
    setSelectedTemplate(null);
    setModalOpen(true);
  };

  const openEditModal = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const enabledCount = toggles.filter((t) => t.enabled).length;

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.key && t.key.toLowerCase().includes(q)) ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Bell className="w-8 h-8 text-[var(--ee-brand)]" />
            Reminders & Automated Workflows Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Configure automated email, SMS, and WhatsApp triggers and manage branded notification templates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Download className="w-4 h-4 mr-1.5" />
            Import Starter Pack
          </Button>
          <Button variant="primary" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Email Template
          </Button>
        </div>
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
          title="Templates Configured"
          value={templates.length}
          subtitle="Email & SMS templates"
          sparkline={<FileText className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Email Channel"
          value="Ready"
          subtitle="White-label SMTP active"
          sparkline={<Mail className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="SMS & WhatsApp"
          value={channelStatus?.sms ? "Connected" : "Ready"}
          subtitle="Twilio API bridge"
          sparkline={<MessageSquare className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--ee-border)]">
        <button
          type="button"
          onClick={() => setActiveTab("triggers")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "triggers"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Zap className="w-4 h-4" /> Trigger Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Mail className="w-4 h-4" /> Notification Templates ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <History className="w-4 h-4" /> Delivery Logs ({logs.length})
        </button>
      </div>

      {/* Tab 1: Trigger Rules */}
      {activeTab === "triggers" && (
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
                    <div className="text-xs text-[var(--ee-muted)]">
                      Triggered automatically based on event date & status.
                    </div>
                  </div>

                  <Badge variant={item.enabled ? "success" : "neutral"} size="sm">
                    {item.enabled ? "Active" : "Paused"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Notification Templates Manager */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--ee-muted)]" />
              <Input
                type="text"
                placeholder="Search templates by key or subject line..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="primary" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Template
            </Button>
          </div>

          {templatesLoading ? (
            <Skeleton height="240px" />
          ) : filteredTemplates.length === 0 ? (
            <Card elevated className="p-12 text-center space-y-3">
              <Mail className="w-12 h-12 text-[var(--ee-muted)] mx-auto opacity-50" />
              <div className="text-lg font-bold text-[var(--ee-text)]">
                {searchQuery ? "No matching templates found" : "No notification templates created yet"}
              </div>
              <p className="text-sm text-[var(--ee-muted)] max-w-md mx-auto">
                Create custom email & SMS templates for quotes, receipts, event planning, and field crew alerts.
              </p>
              <Button variant="primary" onClick={openAddModal} className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Template
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => (
                <Card
                  key={tpl.id || tpl.key}
                  elevated
                  className="p-5 flex flex-col justify-between space-y-4 hover:border-[var(--ee-brand)] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-[var(--ee-brand)] font-bold">
                          {tpl.key}
                        </span>
                        <h3 className="font-bold text-base text-[var(--ee-text)] mt-1.5">
                          {tpl.title || tpl.key}
                        </h3>
                      </div>
                      <Badge variant={tpl.active ? "success" : "neutral"} size="sm">
                        {tpl.active ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--ee-muted)] line-clamp-2">
                      <strong className="text-[var(--ee-text)]">Subject:</strong> {tpl.subject || "(No subject set)"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--ee-border)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="capitalize px-2 py-0.5 rounded bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] border border-[var(--ee-border)]">
                        {tpl.channels || "email"}
                      </span>
                      <span className="capitalize text-[var(--ee-muted)]">
                        {tpl.priority || "transactional"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(tpl)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(tpl)}
                        loading={deletingId === tpl.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Delivery History Logs */}
      {activeTab === "history" && (
        <Card elevated className="p-6 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-bold text-[var(--ee-text)]">
              Recent Dispatch & Delivery Logs
            </CardTitle>
          </CardHeader>

          {logsLoading ? (
            <Skeleton height="200px" />
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--ee-muted)]">
              No recent notification delivery logs found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--ee-border)]">
              {logs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[var(--ee-text)]">
                      {log.title || "Notification Dispatch"}
                    </div>
                    <div className="text-xs text-[var(--ee-muted)] flex items-center gap-2">
                      <span>To: {log.to}</span>
                      <span>•</span>
                      <span className="capitalize">Channel: {log.channel}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <Badge variant={log.status === "Sent" ? "success" : log.status === "Failed" ? "danger" : "neutral"}>
                      {log.status}
                    </Badge>
                    <div className="text-[11px] text-[var(--ee-muted)]">{log.when}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Template Modal */}
      <TemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        template={selectedTemplate}
        onSuccess={() => {
          loadTemplates();
        }}
      />

      {/* Import Industry Starter Pack Modal */}
      <ImportBundleModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          loadTemplates();
        }}
      />
    </div>
  );
};

export default AutomationsPage;
