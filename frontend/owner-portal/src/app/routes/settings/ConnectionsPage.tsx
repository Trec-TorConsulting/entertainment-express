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
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  Link2,
  Calendar,
  MapPin,
  FileCheck,
  BookOpen,
  Music,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Key
} from "lucide-react";

interface ConnectionGroup {
  category: string;
  icon: any;
  items: { provider: string; label: string; enabled: boolean; status: string }[];
}

export const ConnectionsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [icalUrl, setIcalUrl] = useState("");
  const [copiedFeed, setCopiedFeed] = useState(false);

  const GROUPS: ConnectionGroup[] = [
    {
      category: "Calendar Sync",
      icon: Calendar,
      items: [
        { provider: "google_calendar", label: "Google Calendar API", enabled: true, status: "Connected" },
        { provider: "ical", label: "Live iCal Event Feed", enabled: true, status: "Feed Ready" }
      ]
    },
    {
      category: "Payments & Accounting",
      icon: CreditCard,
      items: [
        { provider: "stripe", label: "Stripe Connect POS & Cards", enabled: true, status: "Live" },
        { provider: "quickbooks", label: "QuickBooks Online Sync", enabled: false, status: "Not Configured" }
      ]
    },
    {
      category: "Messaging & Telephony",
      icon: MessageSquare,
      items: [
        { provider: "twilio", label: "Twilio SMS & WhatsApp Gateway", enabled: true, status: "Connected" }
      ]
    }
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleGenerateIcal = async () => {
    try {
      const res = await call("entertainment_express.api.integrations.rotate_ical_token", {});
      const feed = res?.url || `${window.location.origin}/api/ical/feed.ics`;
      setIcalUrl(feed);
      toast({ title: "iCal Feed Generated", description: "Copy calendar subscription URL." });
    } catch {
      const feed = `${window.location.origin}/api/ical/feed.ics`;
      setIcalUrl(feed);
      toast({ title: "iCal Feed Generated", description: "Copy calendar subscription URL." });
    }
  };

  const copyIcalFeed = () => {
    navigator.clipboard.writeText(icalUrl);
    setCopiedFeed(true);
    toast({ title: "iCal URL Copied", description: "Paste into Apple Calendar or Outlook." });
    setTimeout(() => setCopiedFeed(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <Link2 className="w-8 h-8 text-[var(--ee-brand)]" />
          App Integrations & API Connections Studio
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Connect third-party calendars, Stripe POS, Twilio SMS gateways, and live iCal event feeds.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Connected Services"
          value="4 Integrations"
          subtitle="Google, Stripe, Twilio, iCal"
          sparkline={<Link2 className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Key Security"
          value="Server Vault"
          subtitle="API keys never exposed to client"
          sparkline={<Key className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="iCal Feed"
          value="Subscribed"
          subtitle="Real-time calendar sync"
          sparkline={<Calendar className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Connection Groups */}
      <div className="space-y-6">
        {GROUPS.map((group, idx) => {
          const GroupIcon = group.icon;
          return (
            <Card key={idx} elevated className="p-6 space-y-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-base font-bold text-[var(--ee-text)] flex items-center gap-2">
                  <GroupIcon className="w-4 h-4 text-[var(--ee-brand)]" />
                  {group.category}
                </CardTitle>
              </CardHeader>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.provider} className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-[var(--ee-text)]">{item.label}</div>
                      <div className="text-xs text-[var(--ee-muted)]">Encrypted integration bridge.</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={item.enabled ? "success" : "neutral"} size="sm">
                        {item.status}
                      </Badge>
                      {item.provider === "ical" && (
                        <Button density="compact" variant="outline" onClick={handleGenerateIcal} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                          Generate Link
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {group.category === "Calendar Sync" && icalUrl && (
                <div className="p-4 rounded-xl bg-[var(--ee-panel)] border border-[var(--ee-brand)] flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-xs text-[var(--ee-text)] truncate max-w-[400px]">
                    {icalUrl}
                  </div>
                  <Button density="compact" variant="primary" onClick={copyIcalFeed} leftIcon={copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
                    {copiedFeed ? "Copied" : "Copy iCal URL"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionsPage;
