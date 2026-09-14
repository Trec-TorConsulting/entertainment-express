import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Dialog,
  useToast,
  Skeleton,
  EmptyState,
  call,
} from "@portal-kit";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Clock,
  RotateCcw,
  FileCheck,
  Camera,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface FleetSummary {
  readiness_percentage: number;
  total_assets: number;
  available_count: number;
  quarantined_count: number;
  in_repair_count: number;
  pending_inspection_count: number;
  overdue_maintenance_count: number;
  expiring_certificates_count: number;
  recent_defects: any[];
}

export const FleetHealthPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [quarantinedAssets, setQuarantinedAssets] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"quarantine" | "certificates" | "defects">("quarantine");

  // Release Quarantine Modal State
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [repairCost, setRepairCost] = useState("");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [releasing, setReleasing] = useState(false);

  const loadData = async () => {
    try {
      const [sumRes, quarRes, certRes] = await Promise.all([
        call("entertainment_express.api.fleet_maintenance.get_fleet_health_summary", {}),
        call("entertainment_express.api.fleet_maintenance.list_quarantined_assets", {}),
        call("entertainment_express.api.portal_crud.list_records", { kind: "safety_certificate" }).catch(() => ({ rows: [] })),
      ]);
      setSummary(sumRes);
      setQuarantinedAssets(quarRes || []);
      setCertificates(certRes?.rows || []);
    } catch (err: any) {
      toast({
        title: "Error Loading Fleet Data",
        description: err.message || "Failed to fetch fleet health telemetry.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRelease = (asset: any) => {
    setSelectedAsset(asset);
    setRepairCost("");
    setTechnicianNotes("");
    setReleaseModalOpen(true);
  };

  const handleReleaseSubmit = async () => {
    if (!selectedAsset) return;
    setReleasing(true);
    try {
      await call("entertainment_express.api.fleet_maintenance.release_quarantine_api", {
        asset_id: selectedAsset.name,
        repair_cost: parseFloat(repairCost) || 0.0,
        technician_notes: technicianNotes,
      });

      toast({
        title: "Asset Restored to Available",
        description: `${selectedAsset.asset_name || selectedAsset.name} has cleared quarantine and is available for dispatch.`,
        variant: "success",
      });
      setReleaseModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: "Release Failed",
        description: err.message || "Could not clear quarantine status.",
        variant: "danger",
      });
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 animate-in fade-in-50 duration-200">
        <Skeleton width="240px" height="2.5rem" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
          <Skeleton height="7rem" />
        </div>
        <Skeleton height="20rem" />
      </div>
    );
  }

  const readiness = summary?.readiness_percentage ?? 100;
  const isReadinessGood = readiness >= 90;
  const isReadinessWarn = readiness >= 75 && readiness < 90;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)]">
              Fleet Lifecycle & Safety
            </h1>
          </div>
          <p className="text-sm text-[var(--ee-muted)]">
            Telemetry meters, compliance certificates, defect triage, and automated dispatch safety gates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadData}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Score */}
        <div className="p-5 rounded-2xl bg-[var(--ee-surface)] border border-[var(--ee-border)] relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
              Fleet Readiness
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isReadinessGood
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isReadinessWarn
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {isReadinessGood ? "Operational" : isReadinessWarn ? "Caution" : "At Risk"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[var(--ee-text)]">
              {readiness}%
            </span>
            <span className="text-xs text-[var(--ee-muted)]">
              ({summary?.available_count ?? 0} / {summary?.total_assets ?? 0} units)
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-[var(--ee-surface-inset)] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReadinessGood ? "bg-emerald-500" : isReadinessWarn ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, readiness))}%` }}
            />
          </div>
        </div>

        {/* Quarantined Gear */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-sm ${
            (summary?.quarantined_count ?? 0) > 0
              ? "bg-red-500/5 border-red-500/30"
              : "bg-[var(--ee-surface)] border-[var(--ee-border)]"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
              Quarantined Units
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                (summary?.quarantined_count ?? 0) > 0 ? "text-red-500 animate-pulse" : "text-[var(--ee-muted)]"
              }`}
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${
                (summary?.quarantined_count ?? 0) > 0 ? "text-red-600 dark:text-red-400" : "text-[var(--ee-text)]"
              }`}
            >
              {summary?.quarantined_count ?? 0}
            </span>
            <span className="text-xs text-[var(--ee-muted)]">locked from dispatch</span>
          </div>
          <p className="mt-2 text-xs text-[var(--ee-muted)]">
            Auto-blocked across upcoming booking schedules.
          </p>
        </div>

        {/* In Repair / Inspection */}
        <div className="p-5 rounded-2xl bg-[var(--ee-surface)] border border-[var(--ee-border)] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
              Under Service
            </span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[var(--ee-text)]">
              {(summary?.in_repair_count ?? 0) + (summary?.pending_inspection_count ?? 0)}
            </span>
            <span className="text-xs text-[var(--ee-muted)]">
              ({summary?.in_repair_count ?? 0} repair, {summary?.pending_inspection_count ?? 0} inspect)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--ee-muted)]">
            {summary?.overdue_maintenance_count ?? 0} scheduled tasks past due.
          </p>
        </div>

        {/* Compliance Certificates */}
        <div className="p-5 rounded-2xl bg-[var(--ee-surface)] border border-[var(--ee-border)] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ee-muted)]">
              Safety Compliance
            </span>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[var(--ee-text)]">
              {summary?.expiring_certificates_count ?? 0}
            </span>
            <span className="text-xs text-[var(--ee-muted)]">expiring &lt;30 days</span>
          </div>
          <p className="mt-2 text-xs text-[var(--ee-muted)]">
            State amusement & electrical compliance gates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--ee-border)] flex gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab("quarantine")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "quarantine"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)] font-semibold"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Quarantine Queue
          {quarantinedAssets.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
              {quarantinedAssets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "certificates"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)] font-semibold"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Safety Certificates
          {certificates.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] rounded-full">
              {certificates.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("defects")}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "defects"
              ? "border-[var(--ee-brand)] text-[var(--ee-brand)] font-semibold"
              : "border-transparent text-[var(--ee-muted)] hover:text-[var(--ee-text)]"
          }`}
        >
          <Camera className="w-4 h-4" />
          Field Defect Feed
          {(summary?.recent_defects?.length ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-[var(--ee-surface-inset)] text-[var(--ee-muted)] rounded-full">
              {summary?.recent_defects.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Quarantine Queue */}
      {activeTab === "quarantine" && (
        <div className="space-y-4">
          {quarantinedAssets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--ee-surface)] border border-[var(--ee-border)]">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--ee-text)]">All Gear Is Cleared</h3>
              <p className="text-sm text-[var(--ee-muted)] max-w-sm mx-auto mt-1">
                Zero assets currently quarantined. All active fleet units are available for assignment and dispatch.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--ee-border)] bg-[var(--ee-surface)] shadow-sm">
              <div className="divide-y divide-[var(--ee-border)]">
                {quarantinedAssets.map((asset) => (
                  <div key={asset.name} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--ee-surface-inset)]/40 transition-colors">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-[var(--ee-text)] text-base">
                          {asset.asset_name || asset.name}
                        </span>
                        <Badge variant="danger" size="sm">
                          {asset.condition_status}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {asset.asset_type}
                        </Badge>
                        {asset.home_location && (
                          <span className="text-xs text-[var(--ee-muted)]">
                            📍 {asset.home_location}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {asset.quarantine_reason || "Reported damaged during event teardown."}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--ee-muted)]">
                        <span>Meters: {asset.operating_hours || 0} hrs</span>
                        <span>•</span>
                        <span>Events: {asset.event_count || 0}</span>
                        {asset.last_inspection_date && (
                          <>
                            <span>•</span>
                            <span>Last Inspected: {asset.last_inspection_date}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenRelease(asset)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Inspect & Release
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Safety Certificates */}
      {activeTab === "certificates" && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: "certificate_name",
                label: "Certificate Name",
                render: (val, row) => (
                  <div>
                    <span className="font-bold text-[var(--ee-text)]">{val || row.name}</span>
                    {row.certificate_number && (
                      <span className="block text-xs text-[var(--ee-muted)]">
                        #{row.certificate_number}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "issuing_body",
                label: "Issuing Authority",
                render: (val) => val || "State / Third-Party Inspector",
              },
              {
                key: "expiry_date",
                label: "Expiry Date",
                render: (val) => {
                  if (!val) return "No Expiry";
                  const exp = new Date(val);
                  const now = new Date();
                  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = days <= 0;
                  const isSoon = days <= 30;

                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{val}</span>
                      {isExpired ? (
                        <Badge variant="danger" size="sm">EXPIRED</Badge>
                      ) : isSoon ? (
                        <Badge variant="warning" size="sm">{days}d left</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Valid</Badge>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "governed_assets",
                label: "Governed Equipment",
                align: "center",
                render: (val, row) => (
                  <Badge variant="outline" size="sm">
                    {row.governed_assets?.length || "All Inflatables"}
                  </Badge>
                ),
              },
            ]}
            rows={certificates}
          />
        </div>
      )}

      {/* Tab 3: Recent Field Defect Feed */}
      {activeTab === "defects" && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: "reported_at",
                label: "Reported At",
                render: (val) => val ? new Date(val).toLocaleDateString() : "Recent",
              },
              {
                key: "asset_ref",
                label: "Asset",
                render: (val) => (
                  <span className="font-bold font-mono text-xs">{val}</span>
                ),
              },
              {
                key: "severity",
                label: "Severity",
                render: (val) => (
                  <Badge
                    variant={val === "Critical" ? "danger" : val === "Major" ? "warning" : "default"}
                    size="sm"
                  >
                    {val || "Major"}
                  </Badge>
                ),
              },
              {
                key: "defect_description",
                label: "Defect Notes",
                render: (val) => (
                  <span className="text-xs text-[var(--ee-text)] line-clamp-2 max-w-md">{val}</span>
                ),
              },
              {
                key: "reported_by",
                label: "Reported By",
                render: (val) => val || "Field Crew",
              },
              {
                key: "resolution_status",
                label: "Status",
                align: "center",
                render: (val) => (
                  <Badge variant={val === "Resolved" ? "success" : "danger"} size="sm">
                    {val || "Open"}
                  </Badge>
                ),
              },
            ]}
            rows={summary?.recent_defects || []}
          />
        </div>
      )}

      {/* Release Quarantine Dialog */}
      <Dialog
        open={releaseModalOpen}
        onOpenChange={setReleaseModalOpen}
        title="Release Asset from Quarantine"
        description="Verify physical repair, test safety components, and restore asset availability for dispatch."
      >
        <div className="py-4 space-y-4 text-sm">
          <div className="p-4 rounded-xl bg-[var(--ee-surface-inset)] space-y-2 border border-[var(--ee-border)]">
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Asset:</span>
              <span className="font-bold">{selectedAsset?.asset_name || selectedAsset?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ee-muted)]">Quarantine Reason:</span>
              <span className="text-red-500 font-medium text-right max-w-xs truncate">
                {selectedAsset?.quarantine_reason || "Reported Defect"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ee-text)]">
              Repair & Inspection Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full px-3 py-2 rounded-xl bg-[var(--ee-surface)] border border-[var(--ee-border)] text-sm"
              placeholder="0.00"
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--ee-text)]">
              Technician Resolution Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[var(--ee-surface)] border border-[var(--ee-border)] text-sm"
              placeholder="Describe repairs completed (e.g. patched vinyl seam, replaced 1.5HP blower, pressure tested...)"
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--ee-border)]">
          <Button variant="secondary" onClick={() => setReleaseModalOpen(false)} disabled={releasing}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReleaseSubmit} loading={releasing}>
            Confirm Inspection & Release
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
