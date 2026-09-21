import React, { useRef, useState } from "react";
import { Button, Dialog, FormField, useToast } from "@portal-kit";
import { ShieldCheck, CheckCircle2, FileText, RotateCcw } from "lucide-react";

interface EsignModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmSign: (signerName: string, signatureData: string) => void;
  submitting?: boolean;
  totalAmount: number;
  depositAmount: number;
}

export const EsignModal: React.FC<EsignModalProps> = ({
  open,
  onClose,
  onConfirmSign,
  submitting = false,
  totalAmount,
  depositAmount
}) => {
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSigned(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasSigned(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      toast({ title: "Legal Name Required", description: "Please type your full legal name." });
      return;
    }
    const sigData = canvasRef.current ? canvasRef.current.toDataURL("image/png") : "";
    onConfirmSign(signerName, sigData);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title="Review Terms & Execute Digital Signature"
      description="Binding agreement for event performance, asset reservation, and payment terms."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3.5 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-1.5 text-xs text-[var(--ee-text)]">
          <div className="font-bold flex items-center gap-1.5 text-sm">
            <FileText className="w-4 h-4 text-[var(--ee-brand)]" /> Performance & Service Agreement Summary
          </div>
          <p className="text-[var(--ee-muted)]">
            By signing below, you agree to reserve the selected package and add-ons for total ${totalAmount.toLocaleString()} with a required deposit of ${depositAmount.toLocaleString()}.
          </p>
        </div>

        <FormField label="Full Legal Signer Name">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm font-semibold"
            placeholder="e.g. Tobey Rector"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            required
          />
        </FormField>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-[var(--ee-text)]">Draw Signature below:</label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-[var(--ee-muted)] hover:text-rose-500 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear Pad
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="w-full h-28 border border-[var(--ee-border)] rounded-lg bg-white cursor-crosshair touch-none"
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[var(--ee-border)]">
          <Button variant="outline" density="compact" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            density="compact"
            type="submit"
            loading={submitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            I Agree & Execute Signature
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
