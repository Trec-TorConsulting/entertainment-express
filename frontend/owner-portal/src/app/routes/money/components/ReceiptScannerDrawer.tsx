import React, { useState } from "react";
import {
  RecordDrawer,
  Button,
  Input,
  FormField,
  Badge,
  useToast,
  call
} from "@portal-kit";
import { Receipt, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface ReceiptScannerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCreated?: () => void;
}

export const ReceiptScannerDrawer: React.FC<ReceiptScannerDrawerProps> = ({
  isOpen,
  onClose,
  onClaimCreated
}) => {
  const { toast } = useToast();
  const [receiptText, setReceiptText] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const handleScan = async () => {
    if (!receiptText.trim()) {
      toast({ title: "Input Required", description: "Paste or enter receipt details to scan.", variant: "warning" });
      return;
    }
    setScanning(true);
    try {
      const res = await call("entertainment_express.api.ai_expense_scanner.parse_receipt_image", {
        file_content: receiptText,
        booking_id: bookingId || undefined
      });
      setParsedData(res);
      toast({ title: "Receipt Analyzed", description: `Detected ${res.category} expense from ${res.merchant}.`, variant: "success" });
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message, variant: "danger" });
    } finally {
      setScanning(false);
    }
  };

  const handleCreateClaim = async () => {
    if (!parsedData) return;
    setCreating(true);
    try {
      const res = await call("entertainment_express.api.ai_expense_scanner.create_expense_claim", {
        merchant: parsedData.merchant,
        total: parsedData.total,
        category: parsedData.category,
        booking_id: bookingId || parsedData.booking_id || undefined,
        description: `Scanned line items: ${(parsedData.line_items || []).join(", ") || "General receipt"}`
      });
      toast({ title: "Expense Claim Created", description: `${res.claim_name} logged for $${res.amount}.`, variant: "success" });
      setParsedData(null);
      setReceiptText("");
      onClaimCreated?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Claim Creation Failed", description: err.message, variant: "danger" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <RecordDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="AI Receipt Scanner & Expense Matcher"
      description="Multimodal OCR extracts merchant, amount, category, and links directly to event booking Cost Center."
      width="540px"
    >
      <div className="space-y-5 p-4">
        <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] flex items-center gap-3">
          <Receipt className="w-5 h-5 text-[var(--ee-brand)] shrink-0" />
          <p className="text-xs text-[var(--ee-muted)]">
            Crew receipts (fuel, venue parking, tolls, dry ice) are auto-categorized into ERPNext Expense Claims.
          </p>
        </div>

        <div className="space-y-3">
          <FormField label="Link to Event Booking (Optional)" description="Assigns cost directly to the event's P&L and Cost Center">
            <Input
              placeholder="e.g. BK-2026-00042"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          </FormField>

          <FormField label="Receipt Text / Image OCR Data" description="Paste receipt text, merchant invoice line, or OCR transcript">
            <textarea
              className="w-full h-28 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface)] p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
              placeholder="Example: Shell Gas Station #4120. Date: 2026-09-15. Fuel Pump 4: $45.50. Total: $45.50"
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
            />
          </FormField>

          <Button
            variant="primary"
            density="cockpit"
            onClick={handleScan}
            disabled={scanning || !receiptText.trim()}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {scanning ? "Analyzing Receipt..." : "Run AI OCR Extraction"}
          </Button>
        </div>

        {parsedData && (
          <div className="p-4 rounded-xl border border-[var(--ee-brand)] bg-[var(--ee-surface-inset)] space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ee-text)]">Extracted Attributes</span>
              <Badge variant="success" size="sm">{(parsedData.confidence * 100).toFixed(0)}% Confidence</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[var(--ee-muted)] block">Merchant</span>
                <span className="font-semibold text-[var(--ee-text)]">{parsedData.merchant}</span>
              </div>
              <div>
                <span className="text-[var(--ee-muted)] block">Total Amount</span>
                <span className="font-mono font-bold text-[var(--ee-brand)]">${parsedData.total?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[var(--ee-muted)] block">Expense Category</span>
                <Badge variant="default" size="sm">{parsedData.category}</Badge>
              </div>
              <div>
                <span className="text-[var(--ee-muted)] block">Date</span>
                <span className="font-mono">{parsedData.date}</span>
              </div>
            </div>

            <Button
              variant="primary"
              density="cockpit"
              onClick={handleCreateClaim}
              disabled={creating}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="w-full mt-2"
            >
              {creating ? "Creating Claim..." : `Confirm & Create Expense Claim ($${parsedData.total?.toFixed(2)})`}
            </Button>
          </div>
        )}
      </div>
    </RecordDrawer>
  );
};
