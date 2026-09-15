import React, { useState } from "react";
import {
  Dialog,
  Button,
  Input,
  FormField,
  Badge,
  useToast,
  call
} from "@portal-kit";
import { Sparkles, Check, Send, CheckCircle2, Zap } from "lucide-react";

interface SmartQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomer?: string;
  defaultInquiryText?: string;
  onQuoteDispatched?: () => void;
}

export const SmartQuoteModal: React.FC<SmartQuoteModalProps> = ({
  isOpen,
  onClose,
  defaultCustomer = "",
  defaultInquiryText = "",
  onQuoteDispatched
}) => {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState(defaultCustomer);
  const [inquiryText, setInquiryText] = useState(defaultInquiryText);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("better");
  const [dispatching, setDispatching] = useState(false);

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      toast({ title: "Name Required", description: "Enter the customer or lead name.", variant: "warning" });
      return;
    }
    setGenerating(true);
    try {
      // Step 1: parse inquiry text if provided
      let eventDate = "2026-10-15";
      let eventType = "Wedding";
      let guestCount = 120;
      let venueAddress = "Austin, TX";

      if (inquiryText.trim()) {
        const parsed = await call("entertainment_express.api.ai_smart_quote.parse_inquiry_text", {
          inquiry_text: inquiryText
        });
        eventDate = parsed.event_date || eventDate;
        eventType = parsed.event_type || eventType;
        guestCount = parsed.guest_count || guestCount;
        venueAddress = parsed.venue_address || venueAddress;
      }

      // Step 2: synthesize 3-tier quotation
      const res = await call("entertainment_express.api.ai_smart_quote.generate_tiered_quotation", {
        customer_name: customerName,
        event_date: eventDate,
        event_type: eventType,
        venue_address: venueAddress,
        guest_count: guestCount
      });

      setQuoteResult(res);
      setSelectedTier(res.default_tier || "better");
      toast({ title: "Quotation Generated", description: "Synthesized 3 tiered packages in under 60s.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Quoting Failed", description: err.message, variant: "danger" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDispatch = async () => {
    if (!quoteResult || !recipientEmail.trim()) {
      toast({ title: "Email Required", description: "Provide recipient email to dispatch quote.", variant: "warning" });
      return;
    }
    setDispatching(true);
    try {
      const res = await call("entertainment_express.api.ai_smart_quote.approve_and_send_quotation", {
        quotation_id: quoteResult.quotation_id,
        recipient_email: recipientEmail,
        selected_tier: selectedTier
      });
      toast({ title: "Proposal Dispatched!", description: `Sent ${selectedTier.toUpperCase()} proposal to ${recipientEmail}.`, variant: "success" });
      onQuoteDispatched?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Dispatch Failed", description: err.message, variant: "danger" });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="60-Second Instant Lead Quoting Assistant"
    >
      <div className="space-y-4 py-2">
          {!quoteResult ? (
            <div className="space-y-3">
              <FormField label="Prospective Client / Organization Name" required>
                <Input
                  placeholder="e.g. Sarah Jenkins or Apex Software Gala"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </FormField>

              <FormField label="Lead Inquiry Text / Notes" description="Paste raw customer inquiry email, form message, or phone notes">
                <textarea
                  className="w-full h-24 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
                  placeholder="e.g. Looking for a DJ and uplighting for our wedding on October 24th at The Driskill in Austin. About 150 guests."
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                />
              </FormField>

              <Button
                variant="primary"
                density="cockpit"
                onClick={handleGenerate}
                disabled={generating || !customerName.trim()}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                className="w-full"
              >
                {generating ? "Synthesizing Packages..." : "Synthesize 3-Tier Proposal (<60s)"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-[var(--ee-border)] pb-2">
                <div>
                  <span className="font-bold text-[var(--ee-text)]">{quoteResult.customer_name}</span>
                  <span className="text-[var(--ee-muted)] block">{quoteResult.event_type} • {quoteResult.event_date}</span>
                </div>
                <Badge variant="success">{quoteResult.quotation_id}</Badge>
              </div>

              {/* 3 Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(quoteResult.packages || {}).map(([key, pkg]: [string, any]) => {
                  const isSelected = selectedTier === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedTier(key)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[var(--ee-brand)] bg-[var(--ee-surface-inset)] ring-1 ring-[var(--ee-brand)]"
                          : "border-[var(--ee-border)] hover:border-[var(--ee-muted)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[var(--ee-text)]">{pkg.tier_name}</span>
                          <Badge variant={isSelected ? "primary" : "default"} size="sm">{pkg.badge}</Badge>
                        </div>
                        <div className="font-mono font-bold text-base text-[var(--ee-brand)] mb-2">
                          ${pkg.total?.toFixed(2)}
                        </div>
                        <p className="text-[11px] text-[var(--ee-muted)] mb-2">{pkg.description}</p>
                        <ul className="space-y-1 text-[10px] text-[var(--ee-text)]">
                          {(pkg.services || []).map((s: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-[var(--ee-brand)] shrink-0" />
                              <span className="truncate">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 mt-2 border-t border-[var(--ee-border)] flex justify-end">
                        <Badge variant={isSelected ? "success" : "default"} size="sm">
                          {isSelected ? "Selected Tier" : "Click to Select"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-3">
                <FormField label="Recipient Client Email" required>
                  <Input
                    placeholder="client@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </FormField>

                <div className="flex gap-2">
                  <Button variant="ghost" density="cockpit" onClick={() => setQuoteResult(null)}>
                    Re-calculate
                  </Button>
                  <Button
                    variant="primary"
                    density="cockpit"
                    onClick={handleDispatch}
                    disabled={dispatching || !recipientEmail.trim()}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    {dispatching ? "Sending..." : `1-Tap Approve & Dispatch (${selectedTier.toUpperCase()})`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
    </Dialog>
  );
};
