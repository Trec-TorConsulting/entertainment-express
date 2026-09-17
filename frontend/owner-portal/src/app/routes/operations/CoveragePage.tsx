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
  DataTable,
  Skeleton,
  FormField,
  useToast,
  call
} from "@portal-kit";
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2
} from "lucide-react";

export const CoveragePage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    setPolicies([
      { id: "POL-01", provider: "Travelers Commercial General Liability ($2,000,000)", expires: "2027-04-15", status: "Active" },
      { id: "POL-02", provider: "Progressive Commercial Fleet Auto Insurance", expires: "2027-01-10", status: "Active" }
    ]);
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
          <ShieldCheck className="w-8 h-8 text-[var(--ee-brand)]" />
          Insurance, Inspection & Safety Coverage Studio
        </h1>
        <p className="text-base text-[var(--ee-muted)] mt-1">
          Maintain commercial liability policies, equipment inspection certificates, and liability waivers.
        </p>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={3}>
        <MetricCard
          title="Active Policies"
          value={policies.length}
          subtitle="Commercial general & auto"
          sparkline={<ShieldCheck className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="Inspection Status"
          value="All Certified"
          subtitle="Inflatable ASTM inspection"
          sparkline={<FileCheck className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Liability Waivers"
          value="Standard Active"
          subtitle="Client digital sign-off"
          sparkline={<CheckCircle2 className="w-4 h-4 text-purple-500" />}
        />
      </StatGrid>

      {/* Main Coverage Cards */}
      <Card elevated className="p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--ee-border)]">
          <h3 className="font-bold text-base text-[var(--ee-text)]">Commercial Insurance Policies</h3>
          <Badge variant="success" size="sm">Active Coverage</Badge>
        </div>

        <DataTable
          id="owner-coverage-policies-table"
          columns={[
            { key: "provider", label: "Insurance Provider & Policy Type" },
            { key: "expires", label: "Expiration Date" },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (val) => <Badge variant="success" size="sm">{val}</Badge>
            }
          ]}
          rows={policies}
        />
      </Card>
    </div>
  );
};

export default CoveragePage;
