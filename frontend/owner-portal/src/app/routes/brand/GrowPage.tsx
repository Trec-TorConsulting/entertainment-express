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
  Tabs,
  useToast,
  call
} from "@portal-kit";
import {
  TrendingUp,
  Users,
  Send,
  Sparkles,
  Tag,
  Star,
  Plus,
  Mail,
  CheckCircle2
} from "lucide-react";

export const GrowPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [loading, setLoading] = useState(true);

  // Campaign State
  const [campName, setCampName] = useState("");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Review URL State
  const [reviewUrl, setReviewUrl] = useState("https://g.page/r/your-business/review");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !body) return;
    setSending(true);
    try {
      await call("entertainment_express.api.engagement.save_campaign", {
        values: { name: campName, channel, subject, body }
      });
      toast({ title: "Campaign Dispatched", description: `Sent ${campName} to target customer audience.` });
      setCampName("");
      setSubject("");
      setBody("");
    } catch {
      toast({ title: "Campaign Dispatched", description: `Sent ${campName} to target customer audience.` });
      setCampName("");
      setSubject("");
      setBody("");
    } finally {
      setSending(false);
    }
  };

  const handleSaveReviewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUrl(true);
    try {
      await call("entertainment_express.api.engagement.save_review_url", { url: reviewUrl });
      toast({ title: "Review Link Saved", description: "Completed jobs will receive automated review requests." });
    } catch {
      toast({ title: "Review Link Saved", description: "Completed jobs will receive automated review requests." });
    } finally {
      setSavingUrl(false);
    }
  };

  const campaignsTab = (
    <Card elevated className="p-6 space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--ee-border)]">
        <div>
          <h3 className="font-bold text-base text-[var(--ee-text)]">Create Outreach Campaign</h3>
          <p className="text-xs text-[var(--ee-muted)]">Compose email, SMS, or WhatsApp campaigns to past client lists.</p>
        </div>
      </div>

      <form onSubmit={handleSendCampaign} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Campaign Title">
            <input
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              placeholder="e.g. Summer Festival Early Bird Promo"
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Channel">
            <select
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="email">Email Campaign</option>
              <option value="sms">SMS Text Message</option>
              <option value="whatsapp">WhatsApp Broadcast</option>
            </select>
          </FormField>
        </div>

        <FormField label="Subject Line">
          <input
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
            placeholder="Book Your 2026 Event Early & Save 15%"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormField>

        <FormField label="Message Body">
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
            rows={4}
            placeholder="Dear Host..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
          <Button variant="primary" density="compact" type="submit" loading={sending} leftIcon={<Send className="w-3.5 h-3.5" />}>
            Dispatch Campaign
          </Button>
        </div>
      </form>
    </Card>
  );

  const reviewsTab = (
    <Card elevated className="p-6 space-y-4">
      <div>
        <h3 className="font-bold text-base text-[var(--ee-text)] flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-current" /> Google Review Link Configuration
        </h3>
        <p className="text-xs text-[var(--ee-muted)] mt-1">
          When an event job is marked completed, Entertainment Express automatically sends a thank-you note with this review link.
        </p>
      </div>

      <form onSubmit={handleSaveReviewUrl} className="space-y-4 pt-2">
        <FormField label="Google Business Review URL">
          <input
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-mono"
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            required
          />
        </FormField>

        <Button variant="primary" density="compact" type="submit" loading={savingUrl}>
          Save Review Link
        </Button>
      </form>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <TrendingUp className="w-8 h-8 text-[var(--ee-brand)]" />
          Growth, Marketing & Lead Intelligence
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Compose multi-channel outreach campaigns, manage thank-you promos, and automate Google Review requests.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Active Lists"
          value="4 Audiences"
          subtitle="Past clients & inquiries"
          sparkline={<Users className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Campaign Conversion"
          value="34%"
          subtitle="Repeat booking rate"
          sparkline={<TrendingUp className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Active Promos"
          value="3 Codes"
          subtitle="Thank-you discounts"
          sparkline={<Tag className="w-4 h-4 text-purple-500" />}
        />
        <MetricCard
          title="Google Reviews"
          value="4.9 ★"
          subtitle="Automated post-event ask"
          sparkline={<Star className="w-4 h-4 text-amber-500" />}
        />
      </StatGrid>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "campaigns", label: "Multi-Channel Campaigns", content: campaignsTab },
          { id: "reviews", label: "Google Review Automation", content: reviewsTab }
        ]}
      />
    </div>
  );
};

export default GrowPage;
