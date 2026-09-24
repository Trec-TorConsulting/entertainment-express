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
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Mic,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  MessageSquare
} from "lucide-react";

interface ApprovalItem {
  id: string;
  category: "time_off" | "gig_offer" | "client_request" | "timesheet";
  category_label: string;
  title: string;
  subtitle: string;
  requester: string;
  details: string;
  date: string;
  creation: string;
  status: string;
  raw?: any;
}

export const ApprovalsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [summary, setSummary] = useState<any>({
    total_pending: 0,
    time_off: 0,
    gig_offers: 0,
    client_requests: 0,
    timesheets: 0
  });
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [decisionNotes, setDecisionNotes] = useState<{ [key: string]: string }>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.allSettled([
        call("entertainment_express.api.portal_approvals.get_approval_summary", {}),
        call("entertainment_express.api.portal_approvals.list_pending_approvals", {
          category: activeTab === "all" ? null : activeTab
        })
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (listRes.status === "fulfilled" && Array.isArray(listRes.value)) {
        setItems(listRes.value);
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Approvals",
        description: err.message || "Failed to fetch pending approval requests.",
        variant: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  const handleApprove = async (item: ApprovalItem) => {
    const notes = decisionNotes[item.id] || "";
    setActingId(item.id);
    try {
      await call("entertainment_express.api.portal_approvals.approve_item", {
        category: item.category,
        item_id: item.id,
        notes: notes
      });

      toast({
        title: "Request Approved",
        description: `Approved ${item.category_label} for ${item.requester}.`,
        variant: "success"
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      loadApprovals();
    } catch (err: any) {
      toast({
        title: "Approval Error",
        description: err.message || "Failed to approve item.",
        variant: "danger"
      });
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (item: ApprovalItem) => {
    const notes = decisionNotes[item.id] || "";
    setActingId(item.id);
    try {
      await call("entertainment_express.api.portal_approvals.decline_item", {
        category: item.category,
        item_id: item.id,
        notes: notes
      });

      toast({
        title: "Request Declined",
        description: `Declined ${item.category_label} for ${item.requester}.`,
        variant: "success"
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      loadApprovals();
    } catch (err: any) {
      toast({
        title: "Decline Error",
        description: err.message || "Failed to decline item.",
        variant: "danger"
      });
    } finally {
      setActingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.requester.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q)
    );
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "time_off":
        return <Badge variant="warning">🕒 Time Off</Badge>;
      case "gig_offer":
        return <Badge variant="info">🎤 Gig Offer</Badge>;
      case "client_request":
        return <Badge variant="purple">📝 Client Request</Badge>;
      case "timesheet":
        return <Badge variant="neutral">💰 Timesheet</Badge>;
      default:
        return <Badge variant="neutral">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[var(--ee-surface)] via-[var(--ee-surface-inset)] to-[var(--ee-surface)] p-6 rounded-2xl border border-[var(--ee-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[var(--ee-brand)] font-bold text-xs uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" /> Operations Checks & Balances
          </div>
          <h1 className="text-2xl font-bold text-[var(--ee-text)] tracking-tight mt-1">
            Approvals Command Center
          </h1>
          <p className="text-sm text-[var(--ee-muted)] mt-0.5">
            Review and approve staff time off, entertainer gig acceptances, client change requests, and timesheets.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadApprovals}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </Button>
      </div>

      {/* Metrics StatGrid */}
      <StatGrid cols={4}>
        <MetricCard
          title="Pending Time Off"
          value={summary.time_off || 0}
          subtitle="Staff leave requests"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <MetricCard
          title="Offered Gig Acceptances"
          value={summary.gig_offers || 0}
          subtitle="Talent job offers"
          icon={<Mic className="w-5 h-5 text-teal-500" />}
        />
        <MetricCard
          title="Client Change Requests"
          value={summary.client_requests || 0}
          subtitle="Reschedules & Add-ons"
          icon={<FileText className="w-5 h-5 text-purple-500" />}
        />
        <MetricCard
          title="Pending Timesheets"
          value={summary.timesheets || 0}
          subtitle="Payroll hours review"
          icon={<Users className="w-5 h-5 text-indigo-500" />}
        />
      </StatGrid>

      {/* Controls & Queue Tabs */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--ee-border)] pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)]">
            {[
              { id: "all", label: `All Pending (${summary.total_pending || 0})` },
              { id: "time_off", label: `Time Off (${summary.time_off || 0})` },
              { id: "gig_offer", label: `Gig Offers (${summary.gig_offers || 0})` },
              { id: "client_request", label: `Client Requests (${summary.client_requests || 0})` },
              { id: "timesheet", label: `Timesheets (${summary.timesheets || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--ee-brand)] text-white shadow-sm"
                    : "text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ee-muted)]" />
            <Input
              type="text"
              placeholder="Filter approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton height="5rem" />
              <Skeleton height="5rem" />
              <Skeleton height="5rem" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-base font-bold text-[var(--ee-text)]">
                All Approvals Up To Date!
              </div>
              <p className="text-xs text-[var(--ee-muted)] max-w-sm mx-auto">
                No pending time off, gig offers, or client requests requiring review right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface)] hover:border-[var(--ee-brand)] transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--ee-border)] pb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(item.category)}
                      <span className="font-bold text-base text-[var(--ee-text)]">{item.title}</span>
                    </div>

                    <div className="text-xs text-[var(--ee-muted)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted: {new Date(item.creation).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--ee-muted)] font-semibold block">Requester:</span>
                      <span className="text-[var(--ee-text)] font-medium">{item.requester}</span>
                    </div>
                    <div>
                      <span className="text-[var(--ee-muted)] font-semibold block">Schedule / Date:</span>
                      <span className="text-[var(--ee-text)] font-medium">{item.subtitle}</span>
                    </div>
                    <div>
                      <span className="text-[var(--ee-muted)] font-semibold block">Details:</span>
                      <span className="text-[var(--ee-text)] font-medium">{item.details}</span>
                    </div>
                  </div>

                  {/* Decision Note & Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <div className="flex-1 relative">
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ee-muted)]" />
                      <Input
                        type="text"
                        placeholder="Optional decision note for requester..."
                        value={decisionNotes[item.id] || ""}
                        onChange={(e) =>
                          setDecisionNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="pl-9 text-xs bg-[var(--ee-surface-inset)]"
                      />
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={actingId === item.id}
                        onClick={() => handleDecline(item)}
                        className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Decline Request
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={actingId === item.id}
                        onClick={() => handleApprove(item)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Request
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
