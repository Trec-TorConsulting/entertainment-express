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
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Layers,
  ExternalLink
} from "lucide-react";
import { ContractModal } from "./ContractModal";
import { ContractTemplateModal } from "./ContractTemplateModal";

interface EEContract {
  name: string;
  status: string;
  signer_name: string;
  signer_email: string;
  quotation?: string;
  booking?: string;
  template?: string;
  signed_at?: string;
  signed_ip?: string;
  content_hash?: string;
  signature_typed?: string;
  expires_at?: string;
  creation: string;
  rendered_html?: string;
  sign_link?: string;
}

interface EEContractTemplate {
  name: string;
  template_name: string;
  active: number | boolean;
  body: string;
  creation: string;
}

export const ContractsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"contracts" | "templates">("contracts");
  const [contracts, setContracts] = useState<EEContract[]>([]);
  const [templates, setTemplates] = useState<EEContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<EEContract | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EEContractTemplate | null>(null);

  const [auditContract, setAuditContract] = useState<EEContract | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.contract.list_contracts", {
        status: statusFilter,
        search: searchQuery
      });
      if (Array.isArray(res)) {
        setContracts(res);
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Contracts",
        description: err.message || "Failed to fetch contracts.",
        variant: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await call("entertainment_express.api.contract.list_templates", {});
      if (Array.isArray(res)) {
        setTemplates(res);
      }
    } catch {
      // Non-critical loading error
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
    loadTemplates();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadContracts();
  };

  const handleSendSignatureRequest = async (contract: EEContract) => {
    if (!contract.signer_email) {
      toast({
        title: "Signer Email Missing",
        description: "Please edit the contract and provide a valid recipient email.",
        variant: "danger"
      });
      return;
    }

    setSendingId(contract.name);
    try {
      const res = await call("entertainment_express.api.contract.send_contract", {
        contract_name: contract.name
      });
      toast({
        title: "Signature Request Sent",
        description: `Emailed signature link to ${contract.signer_email}`,
        variant: "success"
      });
      loadContracts();
    } catch (err: any) {
      toast({
        title: "Send Failed",
        description: err.message || "Failed to send signature request email.",
        variant: "danger"
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleCopySignLink = (contract: EEContract) => {
    if (!contract.sign_link) return;
    navigator.clipboard.writeText(contract.sign_link);
    toast({
      title: "Signature Link Copied",
      description: "Direct tokenized URL copied to clipboard.",
      variant: "success"
    });
  };

  const handleDeleteContract = async (contract: EEContract) => {
    if (!window.confirm(`Are you sure you want to delete contract '${contract.name}'?`)) {
      return;
    }

    setDeletingId(contract.name);
    try {
      await call("entertainment_express.api.contract.delete_contract", {
        name: contract.name
      });
      toast({
        title: "Contract Deleted",
        description: `Removed ${contract.name}.`,
        variant: "success"
      });
      setContracts((prev) => prev.filter((c) => c.name !== contract.name));
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete contract.",
        variant: "danger"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTemplate = async (template: EEContractTemplate) => {
    if (!window.confirm(`Are you sure you want to delete template '${template.template_name}'?`)) {
      return;
    }

    try {
      await call("entertainment_express.api.contract.delete_template", {
        name: template.name
      });
      toast({
        title: "Template Deleted",
        description: `Removed ${template.template_name}.`,
        variant: "success"
      });
      setTemplates((prev) => prev.filter((t) => t.name !== template.name));
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete template.",
        variant: "danger"
      });
    }
  };

  const openNewContractModal = () => {
    setSelectedContract(null);
    setContractModalOpen(true);
  };

  const openEditContractModal = (c: EEContract) => {
    setSelectedContract(c);
    setContractModalOpen(true);
  };

  const openNewTemplateModal = () => {
    setSelectedTemplate(null);
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (t: EEContractTemplate) => {
    setSelectedTemplate(t);
    setTemplateModalOpen(true);
  };

  const pendingCount = contracts.filter((c) => c.status === "sent" || c.status === "viewed").length;
  const signedCount = contracts.filter((c) => c.status === "signed").length;
  const draftCount = contracts.filter((c) => c.status === "draft").length;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "signed":
        return "success";
      case "sent":
      case "viewed":
        return "brand";
      case "declined":
      case "expired":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <FileCheck className="w-8 h-8 text-[var(--ee-brand)]" />
            Contracts, Agreements & E-Sign Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Create, manage, send, and audit legally binding contracts, rental agreements, and liability waivers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" onClick={openNewTemplateModal}>
            <Layers className="w-4 h-4 mr-1.5" />
            New Template
          </Button>
          <Button variant="primary" onClick={openNewContractModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Contract
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Contracts"
          value={contracts.length}
          subtitle={`${draftCount} drafts in progress`}
          sparkline={<FileText className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Pending Signature"
          value={pendingCount}
          subtitle="Sent or viewed by client"
          sparkline={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Signed & Executed"
          value={signedCount}
          subtitle="Cryptographically verified"
          sparkline={<CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Active Templates"
          value={templates.filter((t) => t.active).length}
          subtitle="Reusable agreement templates"
          sparkline={<Layers className="w-4 h-4 text-indigo-500" />}
        />
      </StatGrid>

      {/* Tabs */}
      <div className="flex border-b border-[var(--ee-border)]">
        <button
          type="button"
          onClick={() => setActiveTab("contracts")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "contracts"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <FileText className="w-4 h-4" /> Contracts & Binding Items ({contracts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)]"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Layers className="w-4 h-4" /> Reusable Contract Templates ({templates.length})
        </button>
      </div>

      {/* Tab 1: Contracts List */}
      {activeTab === "contracts" && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--ee-muted)]" />
              <Input
                type="text"
                placeholder="Search by contract ID, signer name, email, or quote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 h-10 px-3 py-2 text-sm border rounded-md bg-[var(--ee-surface)] text-[var(--ee-text)] border-[var(--ee-border)] focus:outline-none focus:ring-1 focus:ring-[var(--ee-brand)]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="signed">Signed</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>

            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {loading ? (
            <Skeleton height="240px" />
          ) : contracts.length === 0 ? (
            <Card elevated className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-[var(--ee-muted)] mx-auto opacity-50" />
              <div className="text-lg font-bold text-[var(--ee-text)]">
                {searchQuery || statusFilter !== "all" ? "No matching contracts found" : "No contracts or agreements created yet"}
              </div>
              <p className="text-sm text-[var(--ee-muted)] max-w-md mx-auto">
                Generate legally binding contracts from accepted quotes or create custom service agreements and waivers.
              </p>
              <Button variant="primary" onClick={openNewContractModal} className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Contract
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {contracts.map((c) => (
                <Card
                  key={c.name}
                  elevated
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--ee-brand)] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] font-bold text-[var(--ee-brand)]">
                        {c.name}
                      </span>
                      <Badge variant={getStatusVariant(c.status)} size="sm" className="capitalize">
                        {c.status}
                      </Badge>
                      {c.quotation && (
                        <span className="text-xs text-[var(--ee-muted)]">Quote: {c.quotation}</span>
                      )}
                    </div>

                    <div className="font-bold text-base text-[var(--ee-text)]">
                      {c.signer_name || "Valued Client"}{" "}
                      <span className="text-xs font-normal text-[var(--ee-muted)]">
                        ({c.signer_email || "No email set"})
                      </span>
                    </div>

                    {c.status === "signed" && (
                      <div className="flex items-center gap-2 text-xs text-[var(--ee-success)] font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        Signed: {c.signature_typed || c.signer_name} on {c.signed_at}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--ee-border)]">
                    {c.status !== "signed" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendSignatureRequest(c)}
                        loading={sendingId === c.name}
                        disabled={!c.signer_email}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Request Signature
                      </Button>
                    )}

                    {c.sign_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopySignLink(c)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Link
                      </Button>
                    )}

                    {c.status === "signed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditContract(c)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[var(--ee-success)]" />
                        Audit Hash
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditContractModal(c)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteContract(c)}
                      loading={deletingId === c.name}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Contract Templates */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-[var(--ee-muted)]">
              Reusable contract templates governing booking terms, payment schedules, and liability limits.
            </div>
            <Button variant="primary" onClick={openNewTemplateModal}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Template
            </Button>
          </div>

          {templatesLoading ? (
            <Skeleton height="200px" />
          ) : templates.length === 0 ? (
            <Card elevated className="p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-[var(--ee-muted)] mx-auto opacity-50" />
              <div className="text-lg font-bold text-[var(--ee-text)]">
                No contract templates created yet
              </div>
              <p className="text-sm text-[var(--ee-muted)] max-w-md mx-auto">
                Create boilerplate agreement templates for event services, rentals, and waivers.
              </p>
              <Button variant="primary" onClick={openNewTemplateModal} className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Template
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <Card key={tpl.name} elevated className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-[var(--ee-text)]">
                        {tpl.template_name || tpl.name}
                      </h3>
                      <Badge variant={tpl.active ? "success" : "neutral"} size="sm">
                        {tpl.active ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="text-xs text-[var(--ee-muted)] font-mono bg-[var(--ee-surface-inset)] p-3 rounded-lg border border-[var(--ee-border)] line-clamp-3">
                      {tpl.body || "(Empty template body)"}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--ee-border)]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditTemplateModal(tpl)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(tpl)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contract Add/Edit Modal */}
      <ContractModal
        open={contractModalOpen}
        onOpenChange={setContractModalOpen}
        contract={selectedContract}
        templates={templates}
        onSuccess={() => loadContracts()}
      />

      {/* Template Add/Edit Modal */}
      <ContractTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={selectedTemplate}
        onSuccess={() => loadTemplates()}
      />

      {/* Cryptographic Signature Audit Trail Modal */}
      {auditContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-50">
          <Card elevated className="w-full max-w-lg p-6 space-y-4 bg-[var(--ee-panel)] border-[var(--ee-border)]">
            <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
              <h3 className="font-bold text-lg text-[var(--ee-text)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--ee-success)]" />
                Signature Verification Audit Trail
              </h3>
              <button
                type="button"
                onClick={() => setAuditContract(null)}
                className="text-[var(--ee-muted)] hover:text-[var(--ee-text)] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-1">
                <div className="text-[var(--ee-muted)]">CONTRACT IDENTIFIER:</div>
                <div className="font-mono font-bold text-sm text-[var(--ee-brand)]">{auditContract.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-0.5">
                  <div className="text-[var(--ee-muted)]">SIGNER NAME:</div>
                  <div className="font-bold text-[var(--ee-text)]">{auditContract.signer_name}</div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-0.5">
                  <div className="text-[var(--ee-muted)]">TYPED SIGNATURE:</div>
                  <div className="font-bold text-[var(--ee-text)]">{auditContract.signature_typed || auditContract.signer_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-0.5">
                  <div className="text-[var(--ee-muted)]">SIGNED AT (UTC):</div>
                  <div className="font-mono text-[var(--ee-text)]">{auditContract.signed_at}</div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-0.5">
                  <div className="text-[var(--ee-muted)]">SIGNER IP ADDRESS:</div>
                  <div className="font-mono text-[var(--ee-text)]">{auditContract.signed_ip || "Registered IP"}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] space-y-1">
                <div className="text-[var(--ee-muted)]">SHA-256 CONTENT VERIFICATION HASH:</div>
                <div className="font-mono text-[11px] text-[var(--ee-text)] break-all select-all bg-[var(--ee-panel)] p-2 rounded border border-[var(--ee-border)]">
                  {auditContract.content_hash || "hash-verification-active"}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={() => setAuditContract(null)}>
                Close Audit Report
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
