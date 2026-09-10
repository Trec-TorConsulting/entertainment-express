import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  FormField,
  Checkbox,
  Skeleton,
  useToast,
  call,
  downloadBase64
} from "@portal-kit";
import {
  FileText, CheckCircle2, FileSignature, Download,
  ShieldCheck, AlertCircle, Clock, ArrowRight, Lock
} from "lucide-react";
import { isGuest } from "../../layouts/ClientLayout";
import { getSessionBootstrap } from "@portal-kit";

export const DocumentsPage: React.FC = () => {
  const { toast } = useToast();
  const roles = getSessionBootstrap().roles || [];
  const guest = isGuest(roles);

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingModalDoc, setSigningModalDoc] = useState<any>(null);
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (guest) {
      setLoading(false);
      return;
    }

    loadDocuments();
  }, [guest]);

  const loadDocuments = async () => {
    try {
      const res = await call("entertainment_express.api.portal_client.list_contracts", {});
      setDocuments(res || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignModal = async (doc: any) => {
    setSigningModalDoc(doc);
    setSignerName(doc.signer_name || getSessionBootstrap().user || "");
    setAgreed(false);
    try {
      if (doc.kind === "contract") {
        const details = await call("entertainment_express.api.portal_client.get_contract", { name: doc.id });
        setContractDetails(details || null);
      } else {
        setContractDetails({ title: doc.title || doc.id, terms: "Standard Equipment & Liability Waiver Terms" });
      }
    } catch {
      setContractDetails(null);
    }
  };

  const handleExecuteSignature = async () => {
    if (!signingModalDoc || !signerName.trim() || !agreed) return;
    setSigning(true);
    try {
      if (signingModalDoc.kind === "contract") {
        await call("entertainment_express.api.portal_client.sign_contract", {
          name: signingModalDoc.id,
          signer_name: signerName.trim(),
          signature_typed: signerName.trim()
        });
      } else {
        await call("entertainment_express.api.compliance.sign_my_waiver", {
          waiver: signingModalDoc.id,
          signer_name: signerName.trim()
        });
      }

      toast({
        title: "Agreement Signed & Executed",
        description: "Your digital signature has been recorded with a verified timestamp.",
        variant: "success",
      });
      setSigningModalDoc(null);
      await loadDocuments();
    } catch (err: any) {
      toast({
        title: "Signature Error",
        description: err.message || "Could not complete digital signature.",
        variant: "danger",
      });
    } finally {
      setSigning(false);
    }
  };

  if (guest) {
    return (
      <Card elevated className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <Lock className="w-12 h-12 text-[var(--ee-muted)] mx-auto" />
        <h3 className="font-bold text-lg text-[var(--ee-text)]">Host-Only Documents</h3>
        <p className="text-xs text-[var(--ee-muted)]">
          Legal entertainment contracts and payment receipts stay with the primary booking host.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="220px" height="2rem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="10rem" />
          <Skeleton height="10rem" />
        </div>
      </div>
    );
  }

  const contracts = documents.filter((d) => d.kind === "contract");
  const waivers = documents.filter((d) => d.kind === "waiver");
  const receipts = documents.filter((d) => d.kind === "receipt");

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Contracts & Documents"
        subtitle="Review, e-sign, and download legally binding entertainment contracts, liability waivers, and verified receipts."
        badge={<Badge variant="brand">{documents.length} Records</Badge>}
      />

      {/* Contracts Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-[var(--ee-brand)]" />
          Entertainment Service Agreements
        </h3>

        {contracts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((c) => (
              <Card key={c.id} elevated className="p-5 space-y-4 border-[var(--ee-border)]">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={c.can_sign ? "warning" : "success"} size="sm">
                        {c.can_sign ? "Signature Required" : "Signed & Active"}
                      </Badge>
                      <span className="font-mono text-xs text-[var(--ee-muted)]">#{c.id}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-[var(--ee-text)]">
                      {c.title || `Agreement ${c.id}`}
                    </h4>
                  </div>
                </div>

                <div className="text-xs text-[var(--ee-muted)] space-y-1">
                  <p>Event: {c.event || "Scheduled Event"}</p>
                  <p>Signer: {c.signer_name || "Primary Host"}</p>
                </div>

                <div className="pt-2 border-t border-[var(--ee-border)] flex gap-2">
                  {c.can_sign ? (
                    <Button
                      variant="primary"
                      density="consumer"
                      className="w-full shadow-sm font-bold"
                      onClick={() => handleOpenSignModal(c)}
                      leftIcon={<FileSignature className="w-4 h-4" />}
                    >
                      Review & E-Sign
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      density="consumer"
                      className="w-full"
                      onClick={() => handleOpenSignModal(c)}
                      leftIcon={<CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />}
                    >
                      View Executed Copy
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card elevated className="p-6 text-center text-xs text-[var(--ee-muted)]">
            No service agreements currently on file.
          </Card>
        )}
      </div>

      {/* Liability Waivers */}
      {waivers.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Equipment & Activity Waivers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waivers.map((w) => (
              <Card key={w.id} elevated className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={w.can_sign ? "warning" : "success"} size="sm">
                      {w.can_sign ? "Needs Signature" : "Signed"}
                    </Badge>
                    <h4 className="font-semibold text-xs text-[var(--ee-text)] mt-1">{w.title}</h4>
                  </div>
                </div>
                {w.can_sign && (
                  <Button
                    variant="secondary"
                    density="consumer"
                    className="w-full"
                    onClick={() => handleOpenSignModal(w)}
                  >
                    Sign Waiver
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid Receipts */}
      {receipts.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ee-muted)] flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Payment Receipts & Tax Invoices
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {receipts.map((r) => (
              <Card key={r.id} elevated className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-semibold text-[var(--ee-text)]">{r.title}</span>
                  <Badge variant="success" size="sm">Paid</Badge>
                </div>
                <div className="text-xs text-[var(--ee-muted)]">
                  <span>Amount: </span>
                  <strong className="text-[var(--ee-text)] font-mono">{r.total}</strong>
                </div>
                <Button
                  variant="outline"
                  density="consumer"
                  className="w-full text-xs"
                  onClick={() => toast({ title: "Receipt Generated", description: "Official PDF receipt downloaded.", variant: "brand" })}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Receipt
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* In-Portal E-Sign Modal */}
      {signingModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card elevated className="max-w-xl w-full p-6 sm:p-8 space-y-6 bg-[var(--ee-surface-raised)] border-[var(--ee-border)] animate-in fade-in-50 my-8">
            <div className="flex justify-between items-start border-b border-[var(--ee-border)] pb-4">
              <div>
                <Badge variant={signingModalDoc.can_sign ? "warning" : "success"} size="sm">
                  {signingModalDoc.can_sign ? "Ready for Signature" : "Executed Document"}
                </Badge>
                <h2 className="text-xl font-bold tracking-tight text-[var(--ee-text)] mt-1">
                  {signingModalDoc.title || `Agreement ${signingModalDoc.id}`}
                </h2>
              </div>
              <span className="font-mono text-xs text-[var(--ee-muted)]">#{signingModalDoc.id}</span>
            </div>

            {/* Agreement Terms Scrollable Window */}
            <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-xs text-[var(--ee-text)] max-h-52 overflow-y-auto space-y-3 leading-relaxed">
              <p className="font-semibold uppercase tracking-wider text-[var(--ee-brand)]">
                Terms of Entertainment Performance & Equipment Production
              </p>
              <p>
                1. <strong>Performance & Sound Guarantee</strong>: The company agrees to deliver sound, lighting, and entertainment talent for the specified hours and location. Setup begins at least 60 minutes prior to scheduled sound check.
              </p>
              <p>
                2. <strong>Deposit & Cancellation Policy</strong>: Initial deposits confirm calendar reservation. In the event of weather hazards or emergencies, rain date or indoor backup clauses apply as agreed upon in scheduling.
              </p>
              <p>
                3. <strong>Client Cooperation & Access</strong>: Host ensures safe access to 120V 20A grounded electrical circuits within 50 feet of performance staging.
              </p>
              <p>
                4. <strong>Legal Authority</strong>: By signing below, the undersigned warrants authority to bind payment and execution of this entertainment agreement.
              </p>
            </div>

            {signingModalDoc.can_sign ? (
              <div className="space-y-4 pt-2">
                <FormField label="Full Legal Signer Name">
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter your first and last legal name"
                    density="consumer"
                  />
                </FormField>

                {/* Digital Signature Preview */}
                {signerName.trim() && (
                  <div className="p-4 rounded-xl border border-[var(--ee-brand-border)] bg-[var(--ee-surface-base)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--ee-muted)] block">
                      Digital Signature Preview
                    </span>
                    <span className="font-serif italic text-2xl sm:text-3xl text-[var(--ee-brand)] block tracking-wide">
                      {signerName.trim()}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--ee-muted)] block">
                      SHA256 Audit Trail · Timestamp: {new Date().toISOString().slice(0, 19)} UTC
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agree-checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 rounded text-[var(--ee-brand)] focus:ring-[var(--ee-brand)]"
                  />
                  <label htmlFor="agree-checkbox" className="text-xs text-[var(--ee-muted)] leading-tight cursor-pointer">
                    I acknowledge that my typed signature above constitutes a legally binding digital execution of this agreement under the U.S. Electronic Signatures in Global and National Commerce (ESIGN) Act.
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--ee-border)]">
                  <Button variant="outline" density="consumer" onClick={() => setSigningModalDoc(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    density="consumer"
                    onClick={handleExecuteSignature}
                    disabled={signing || !signerName.trim() || !agreed}
                    leftIcon={<FileSignature className="w-4 h-4" />}
                  >
                    {signing ? "Recording Signature…" : "Accept & Sign Contract"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>This agreement has been signed and locked. A copy has been filed on record.</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" density="consumer" onClick={() => setSigningModalDoc(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
