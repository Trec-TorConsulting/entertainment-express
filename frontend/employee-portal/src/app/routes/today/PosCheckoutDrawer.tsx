import React, { useState, useEffect } from "react";
import {
  Button,
  Badge,
  useToast
} from "@portal-kit";
import {
  CreditCard,
  Bluetooth,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  X,
  Battery,
  Smartphone
} from "lucide-react";
import { terminalService, TerminalReader, PaymentSummary } from "../../services/terminal";

interface PosCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentComplete: () => void;
}

export const PosCheckoutDrawer: React.FC<PosCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentComplete
}) => {
  const { toast } = useToast();
  const [readers, setReaders] = useState<TerminalReader[]>([]);
  const [selectedReader, setSelectedReader] = useState<TerminalReader | null>(null);
  const [connectionType, setConnectionType] = useState<"bluetooth" | "cloud">("bluetooth");
  const [isSearching, setIsSearching] = useState(false);

  // Billing state
  const baseBalance = Number(booking?.outstanding_amount || booking?.balance || 500);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const overtimeRate = 125.0; // $125/hr standard overtime rate
  const overtimeTotal = overtimeHours * overtimeRate;

  // Tip state: default to 20%
  const subtotal = baseBalance + overtimeTotal;
  const [tipPercentage, setTipPercentage] = useState<number | null>(20);
  const [customTip, setCustomTip] = useState<string>("");

  const tipAmount =
    tipPercentage !== null
      ? (subtotal * tipPercentage) / 100
      : customTip
      ? parseFloat(customTip) || 0
      : 0;

  const grandTotal = subtotal + tipAmount;

  // Payment processing state
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptRecipient, setReceiptRecipient] = useState<string>(booking?.client_phone || "");
  const [receiptSent, setReceiptSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      scanReaders(connectionType);
    }
  }, [isOpen, connectionType]);

  const scanReaders = async (type: "bluetooth" | "cloud") => {
    setIsSearching(true);
    try {
      let list: TerminalReader[] = [];
      if (type === "bluetooth") {
        list = await terminalService.discoverBluetoothReaders();
      } else {
        list = await terminalService.discoverCloudReaders();
      }
      setReaders(list);
      if (list.length > 0 && !selectedReader) {
        setSelectedReader(list[0]);
      }
    } catch (e) {
      console.warn("Reader scan failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async (reader: TerminalReader) => {
    const ok = await terminalService.connectReader(reader);
    if (ok) {
      setSelectedReader(reader);
      toast({
        title: "Reader Connected",
        description: `Connected to ${reader.label || reader.device_type || "Card Reader"}`
      });
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setStatusMessage("Initializing payment...");

    const invoiceName = booking?.invoice_name || booking?.name || "INV-MOCK";
    const summary: PaymentSummary = {
      invoice_name: invoiceName,
      booking_name: booking?.name,
      amount: subtotal,
      tip_amount: tipAmount,
      overtime_hours: overtimeHours,
      overtime_amount: overtimeTotal,
      total_amount: grandTotal
    };

    const result = await terminalService.collectAndProcess(summary, (msg) => {
      setStatusMessage(msg);
    });

    setIsProcessing(false);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: "Payment Approved!",
        description: `Successfully collected $${grandTotal.toFixed(2)} via Terminal`
      });
      onPaymentComplete();
    } else {
      toast({
        title: "Payment Declined",
        description: result.error || "Card was declined or timed out.",
        variant: "destructive"
      });
    }
  };

  const handleSendReceipt = async () => {
    if (!receiptRecipient) return;
    try {
      await terminalService.sendReceipt(
        receiptRecipient,
        receiptRecipient.includes("@") ? "email" : "sms",
        booking?.invoice_name || booking?.name,
        grandTotal,
        tipAmount,
        "4242"
      );
      setReceiptSent(true);
      toast({
        title: "Receipt Sent",
        description: `Digital receipt dispatched to ${receiptRecipient}`
      });
    } catch (e) {
      toast({
        title: "Error Sending Receipt",
        description: "Failed to dispatch receipt.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col h-full shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">On-Site POS Terminal</h2>
              <p className="text-xs text-zinc-400">Collect final balance, overtime & client tip</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {isSuccess ? (
            /* Success & Receipt View */
            <div className="space-y-6 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white">Payment Approved</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  ${grandTotal.toFixed(2)} charged to client card
                </p>
                {tipAmount > 0 && (
                  <Badge variant="outline" className="mt-3 bg-emerald-950/40 text-emerald-400 border-emerald-800/50">
                    <Sparkles className="w-3 h-3 mr-1" />
                    ${tipAmount.toFixed(2)} added to Crew Tip Pool
                  </Badge>
                )}
              </div>

              {/* Digital Receipt Card */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left space-y-3">
                <label className="text-xs font-medium text-zinc-400">Send Digital Receipt (SMS or Email)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 555-123-4567 or client@email.com"
                    value={receiptRecipient}
                    onChange={(e) => setReceiptRecipient(e.target.value)}
                    disabled={receiptSent}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <Button
                    onClick={handleSendReceipt}
                    disabled={receiptSent || !receiptRecipient}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {receiptSent ? "Sent!" : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                Done & Return to Jobs
              </Button>
            </div>
          ) : (
            <>
              {/* Hardware Reader Card */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Hardware Terminal
                  </span>
                  <div className="flex gap-1 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <button
                      onClick={() => setConnectionType("bluetooth")}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        connectionType === "bluetooth"
                          ? "bg-indigo-600 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Bluetooth className="w-3.5 h-3.5" />
                      Bluetooth
                    </button>
                    <button
                      onClick={() => setConnectionType("cloud")}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        connectionType === "cloud"
                          ? "bg-indigo-600 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      WisePOS WiFi
                    </button>
                  </div>
                </div>

                {/* Reader Selector */}
                {isSearching ? (
                  <div className="py-3 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    Scanning for nearby {connectionType === "bluetooth" ? "Bluetooth readers" : "Cloud readers"}...
                  </div>
                ) : readers.length === 0 ? (
                  <div className="py-3 text-center text-xs text-zinc-400">
                    No hardware readers found. Operating with simulated terminal.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {readers.map((r, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleConnect(r)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          selectedReader?.id === r.id
                            ? "border-indigo-500/80 bg-indigo-950/20 text-indigo-200"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-4 h-4 text-zinc-400" />
                          <div>
                            <p className="text-sm font-medium">{r.label || r.device_type || "Stripe Reader M2"}</p>
                            <p className="text-xs text-zinc-500">ID: {r.id || r.serial_number || "Active"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.battery_level !== undefined && (
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Battery className="w-3 h-3 text-emerald-400" />
                              {r.battery_level}%
                            </span>
                          )}
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                            Ready
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Outstanding Event Balance</span>
                    <span className="font-semibold text-white">${baseBalance.toFixed(2)}</span>
                  </div>

                  {/* Overtime Add-on */}
                  <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-zinc-300">Day-of Overtime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(parseFloat(e.target.value))}
                        className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value={0}>No Overtime</option>
                        <option value={0.5}>+30 min ($62.50)</option>
                        <option value={1}>+1 hour ($125.00)</option>
                        <option value={1.5}>+1.5 hours ($187.50)</option>
                        <option value={2}>+2 hours ($250.00)</option>
                      </select>
                      {overtimeTotal > 0 && (
                        <span className="font-semibold text-white">+${overtimeTotal.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Subtotal Before Tip</span>
                    <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Tip Prompts */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Customer Tip Prompt
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setTipPercentage(pct);
                          setCustomTip("");
                        }}
                        className={`py-2 px-1 rounded-lg border text-center transition-all ${
                          tipPercentage === pct
                            ? "border-indigo-500 bg-indigo-600 text-white font-semibold"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className="text-xs">{pct}%</div>
                        <div className="text-[10px] opacity-80">${((subtotal * pct) / 100).toFixed(0)}</div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setTipPercentage(null);
                        setCustomTip("25");
                      }}
                      className={`py-2 px-1 rounded-lg border text-center transition-all ${
                        tipPercentage === null && customTip
                          ? "border-indigo-500 bg-indigo-600 text-white font-semibold"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs">Custom</div>
                      <div className="text-[10px] opacity-80">$$</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipPercentage(null);
                        setCustomTip("");
                      }}
                      className={`py-2 px-1 rounded-lg border text-center transition-all ${
                        tipPercentage === null && !customTip
                          ? "border-zinc-600 bg-zinc-800 text-white font-semibold"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs">No Tip</div>
                      <div className="text-[10px] opacity-80">$0</div>
                    </button>
                  </div>

                  {tipPercentage === null && customTip !== "" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Custom Tip Amount ($):</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Grand Total Bar */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-zinc-900 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-indigo-300">Total To Charge</span>
                    <p className="text-2xl font-bold tracking-tight text-white">${grandTotal.toFixed(2)}</p>
                  </div>
                  <Badge variant="outline" className="border-indigo-500/40 text-indigo-300">
                    Fee Absorbed
                  </Badge>
                </div>
              </div>

              {/* Terminal Action Button */}
              <div className="space-y-3 pt-4">
                {isProcessing ? (
                  <div className="p-4 rounded-xl bg-zinc-900 border border-indigo-500/50 flex flex-col items-center justify-center space-y-3 text-center">
                    <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-medium text-indigo-300 animate-pulse">{statusMessage}</p>
                    <p className="text-xs text-zinc-400">Please have client tap or insert card on reader</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleProcessPayment}
                    className="w-full py-6 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Collect ${grandTotal.toFixed(2)} via Terminal
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
