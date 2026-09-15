import React, { useState, useEffect } from "react";
import {
  RecordDrawer,
  Button,
  Badge,
  DataTable,
  useToast,
  call
} from "@portal-kit";
import { Send, DollarSign, Clock, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface DunningReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DunningReviewDrawer: React.FC<DunningReviewDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [agingItems, setAgingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<any | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  const loadAging = async () => {
    setLoading(true);
    try {
      const rows = await call("entertainment_express.api.ai_dunning.scan_ar_aging", {});
      setAgingItems(rows || []);
      if (rows && rows.length > 0 && !selectedItem) {
        selectAndDraft(rows[0]);
      }
    } catch (err: any) {
      toast({ title: "Failed to scan AR aging", description: err.message, variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAging();
    }
  }, [isOpen]);

  const selectAndDraft = async (item: any) => {
    setSelectedItem(item);
    setDrafting(true);
    try {
      const res = await call("entertainment_express.api.ai_dunning.generate_dunning_message", {
        booking_id: item.booking_id,
        tier: item.tier
      });
      setGeneratedMessage(res);
    } catch (err: any) {
      toast({ title: "Drafting Failed", description: err.message, variant: "danger" });
    } finally {
      setDrafting(false);
    }
  };

  const handleSendNotice = async (channel: "email" | "sms") => {
    if (!selectedItem) return;
    setSending(true);
    try {
      await call("entertainment_express.api.ai_dunning.send_dunning_notice", {
        booking_id: selectedItem.booking_id,
        channel
      });
      toast({ title: "Payment Notice Sent", description: `Autonomous reminder dispatched via ${channel.toUpperCase()}.`, variant: "success" });
      loadAging();
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message, variant: "danger" });
    } finally {
      setSending(false);
    }
  };

  return (
    <RecordDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Autonomous AR Dunning Agent"
      description="Evaluates unpaid event balances, calculates urgency, and sends tone-adaptive reminders with Stripe payment links."
      width="640px"
    >
      <div className="space-y-6 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ee-text)] uppercase tracking-wider">Overdue & Upcoming Balances</span>
            <Button variant="ghost" density="cockpit" onClick={loadAging}>Refresh Scanner</Button>
          </div>

          {agingItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--ee-muted)] border border-dashed border-[var(--ee-border)] rounded-xl">
              No outstanding balances detected. Accounts receivable is 100% current!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agingItems.map((item) => (
                <div
                  key={item.booking_id}
                  onClick={() => selectAndDraft(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs flex items-center justify-between ${
                    selectedItem?.booking_id === item.booking_id
                      ? "border-[var(--ee-brand)] bg-[var(--ee-surface-inset)]"
                      : "border-[var(--ee-border)] hover:bg-[var(--ee-surface-inset)]"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-[var(--ee-text)] block">{item.customer_name}</span>
                    <span className="text-[var(--ee-muted)]">{item.booking_id} • Event: {item.event_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[var(--ee-brand)] block">${item.outstanding_amount?.toFixed(2)}</span>
                    <Badge variant={item.urgency === "critical" ? "danger" : item.urgency === "high" ? "warning" : "default"} size="sm">
                      {item.tier}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ee-text)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                AI Generated Reminder ({selectedItem.tier})
              </span>
              <span className="font-mono text-xs font-bold text-[var(--ee-brand)]">Due: ${selectedItem.outstanding_amount?.toFixed(2)}</span>
            </div>

            {drafting ? (
              <div className="p-4 text-center text-xs text-[var(--ee-muted)]">Synthesizing tone-adaptive copy...</div>
            ) : generatedMessage ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--ee-muted)] block font-medium">Subject</span>
                  <p className="font-semibold text-[var(--ee-text)] mt-0.5">{generatedMessage.subject}</p>
                </div>
                <div>
                  <span className="text-[var(--ee-muted)] block font-medium">Email Draft</span>
                  <div className="p-2.5 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] whitespace-pre-line text-[var(--ee-text)] mt-0.5 font-sans">
                    {generatedMessage.email_body}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--ee-muted)] block font-medium">SMS Draft</span>
                  <div className="p-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] text-[var(--ee-text)] mt-0.5 font-mono text-[11px]">
                    {generatedMessage.sms_body}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    density="cockpit"
                    onClick={() => handleSendNotice("email")}
                    disabled={sending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    Send Email Notice
                  </Button>
                  <Button
                    variant="secondary"
                    density="cockpit"
                    onClick={() => handleSendNotice("sms")}
                    disabled={sending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    Send SMS Notice
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </RecordDrawer>
  );
};
