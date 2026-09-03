import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageHeader,
  FilterBar,
  DataTable,
  RecordDrawer,
  Button,
  Badge,
  Card,
  Dialog,
  useToast,
  Skeleton,
  EmptyState,
  call
} from "@portal-kit";
import {
  Sparkles, CheckCircle2, Send, Check, AlertTriangle,
  FileText, Clock, User, DollarSign, ChevronRight
} from "lucide-react";

const STAGES = [
  { id: "inquiry", label: "Inquiry" },
  { id: "quote", label: "Quote" },
  { id: "contract", label: "Contract" },
  { id: "booked", label: "Booked" },
];

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [proposalDoc, setProposalDoc] = useState<any | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const reload = async () => {
    try {
      const res = await call("entertainment_express.api.portal_crud.list_records", { kind: "inquiry" });
      const rows = (res.rows || []).map((r: any) => ({ ...r, id: r.name || r.id }));
      setInquiries(rows);

      // If drawer is open, keep selected inquiry in sync
      if (selectedInquiry) {
        const updated = rows.find((r: any) => r.id === selectedInquiry.id);
        if (updated) setSelectedInquiry(updated);
      }
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openInquiryDetail = async (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setDrawerOpen(true);
    setProposalLoading(true);
    try {
      const prop = await call("entertainment_express.api.portal_proposal.get_proposal", {
        source: "inquiry",
        name: inquiry.id
      });
      setProposalDoc(prop);
    } catch {
      setProposalDoc(null);
    } finally {
      setProposalLoading(false);
    }
  };

  const handleSendProposal = async () => {
    if (!selectedInquiry) return;
    setSending(true);
    try {
      await call("entertainment_express.api.portal_proposal.send_proposal", {
        source: "inquiry",
        name: selectedInquiry.id
      });

      // Update state without full page reload
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === selectedInquiry.id ? { ...item, status: "Quote Sent", stage: "quote" } : item
        )
      );
      setSelectedInquiry((prev: any) => (prev ? { ...prev, status: "Quote Sent", stage: "quote" } : null));

      setSendDialogOpen(false);
      toast({
        title: "Proposal Dispatched",
        description: `Proposal successfully sent to ${selectedInquiry.client_name || selectedInquiry.party || "client"}.`,
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Failed to send proposal",
        description: err.message || "An error occurred while sending.",
        variant: "danger"
      });
    } finally {
      setSending(false);
    }
  };

  // Determine stage index
  const getStageIndex = (status: string = "") => {
    const s = status.toLowerCase();
    if (s.includes("booked") || s.includes("won") || s.includes("confirmed")) return 3;
    if (s.includes("contract") || s.includes("sign")) return 2;
    if (s.includes("quote") || s.includes("sent") || s.includes("proposal")) return 1;
    return 0;
  };

  const currentStageIndex = getStageIndex(selectedInquiry?.status || selectedInquiry?.stage);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <Skeleton height="3rem" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="3.5rem" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Inquiries & Pipeline"
        subtitle="Manage client inquiries, customize proposal packages, and convert quotes into confirmed bookings."
        badge={
          <Badge variant="brand" size="sm">
            {inquiries.length} Active Deals
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            density="cockpit"
            onClick={() => navigate("/pipeline/new")}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            + New Inquiry
          </Button>
        }
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter deals by client, event, or status..."
        chips={[
          { id: "all", label: "All Inquiries", count: inquiries.length },
          { id: "quote", label: "Quoted", count: inquiries.filter((i) => i.status?.toLowerCase().includes("quote")).length },
          { id: "contract", label: "Contract Out", count: inquiries.filter((i) => i.status?.toLowerCase().includes("contract")).length },
        ]}
      />

      <DataTable
        id="owner-pipeline-table"
        columns={[
          {
            key: "client_name",
            label: "Client / Event",
            render: (val, row) => (
              <div>
                <div className="font-semibold text-[var(--ee-text)]">{val || row.party || row.name}</div>
                <div className="text-xs text-[var(--ee-muted)]">{row.event_type || row.package || "General Event"}</div>
              </div>
            )
          },
          {
            key: "event_date",
            label: "Event Date",
            render: (val) => val || "TBD"
          },
          {
            key: "total_amount",
            label: "Deal Value",
            align: "right",
            render: (val, row) => (
              <span className="font-mono tabular-nums font-medium">
                {val || row.total || "—"}
              </span>
            )
          },
          {
            key: "status",
            label: "Stage",
            align: "center",
            render: (val) => {
              const statusStr = val || "Inquiry";
              const isQuote = statusStr.toLowerCase().includes("quote");
              const isBooked = statusStr.toLowerCase().includes("booked") || statusStr.toLowerCase().includes("won");
              return (
                <Badge
                  variant={isBooked ? "success" : isQuote ? "brand" : "default"}
                  size="sm"
                >
                  {statusStr}
                </Badge>
              );
            }
          }
        ]}
        rows={inquiries.filter((row) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            (row.client_name || "").toLowerCase().includes(q) ||
            (row.party || "").toLowerCase().includes(q) ||
            (row.event_type || "").toLowerCase().includes(q) ||
            (row.status || "").toLowerCase().includes(q)
          );
        })}
        onRowClick={(row) => openInquiryDetail(row)}
        renderActions={(row) => (
          <Button
            variant="ghost"
            density="cockpit"
            onClick={(e) => {
              e.stopPropagation();
              openInquiryDetail(row);
            }}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Review
          </Button>
        )}
      />

      {/* Flagship Split Workspace / RecordDrawer */}
      {selectedInquiry && (
        <RecordDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={selectedInquiry.client_name || selectedInquiry.party || selectedInquiry.name}
          subtitle={`Deal ID #${selectedInquiry.id} • ${selectedInquiry.event_date || "Date Pending"}`}
          badge={
            <Badge variant="brand">
              {selectedInquiry.status || "Inquiry"}
            </Badge>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Dismiss
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/pipeline/${encodeURIComponent(selectedInquiry.id)}/proposal`)}
                >
                  Full Editor
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setSendDialogOpen(true)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send Proposal
                </Button>
              </div>
            </>
          }
        >
          {/* Stage Stepper */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
              Deal Progression
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)]">
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium text-center transition-all ${
                      isCurrent
                        ? "bg-[var(--ee-brand)] text-white shadow-sm font-semibold"
                        : isPassed
                        ? "text-[var(--ee-brand)] bg-[var(--ee-brand-soft)]"
                        : "text-[var(--ee-muted)]"
                    }`}
                  >
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proposal Summary Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-[var(--ee-text)]">
              Proposal Summary
            </h3>
            {proposalLoading ? (
              <div className="space-y-2 p-4 bg-[var(--ee-surface-inset)] rounded-xl">
                <Skeleton height="1.25rem" />
                <Skeleton height="1.25rem" />
              </div>
            ) : proposalDoc ? (
              <div className="p-4 bg-[var(--ee-surface-inset)] rounded-xl border border-[var(--ee-border)] space-y-3">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-[var(--ee-muted)]">Total Contract:</span>
                  <span className="font-mono font-bold text-base tabular-nums">
                    {proposalDoc.total || "$0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-[var(--ee-muted)]">Required Deposit:</span>
                  <span className="font-mono font-semibold text-sm tabular-nums text-[var(--ee-brand)]">
                    {proposalDoc.deposit || "$0.00"}
                  </span>
                </div>
                {proposalDoc.lines && proposalDoc.lines.length > 0 && (
                  <div className="pt-2 border-t border-[var(--ee-border)] space-y-1">
                    <span className="text-xs text-[var(--ee-muted)] block">Package Inclusions:</span>
                    {proposalDoc.lines.map((l: any, i: number) => (
                      <div key={i} className="text-xs flex justify-between">
                        <span>{l.name}</span>
                        <span className="font-mono tabular-nums text-[var(--ee-muted)]">{l.rate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[var(--ee-surface-inset)] rounded-xl text-xs text-[var(--ee-muted)]">
                Proposal draft not yet initialized for this record.
              </div>
            )}
          </div>
        </RecordDrawer>
      )}

      {/* Confirmation Dialog for Send Proposal */}
      <Dialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Dispatch Client Proposal"
        description="This will send an email and SMS link to the client with the proposal, e-signature agreement, and deposit payment request."
      >
        <div className="py-4 space-y-3 text-sm">
          <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Recipient:</span>
              <span className="font-semibold">{selectedInquiry?.client_name || selectedInquiry?.party || "Client"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Proposal Total:</span>
              <span className="font-mono font-bold tabular-nums">{proposalDoc?.total || selectedInquiry?.total_amount || "$0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Deposit Due:</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--ee-brand)]">{proposalDoc?.deposit || "$0.00"}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--ee-border-subtle)]">
          <Button variant="secondary" onClick={() => setSendDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendProposal} loading={sending}>
            Confirm & Send
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
