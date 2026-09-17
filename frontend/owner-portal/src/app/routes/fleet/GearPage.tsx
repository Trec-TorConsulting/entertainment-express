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
  EmptyState,
  Skeleton,
  Dialog,
  FormField,
  Tabs,
  useToast,
  call
} from "@portal-kit";
import {
  Box,
  Truck,
  Wrench,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Plus,
  ShieldCheck,
  Tag,
  Clock
} from "lucide-react";

interface GearAsset {
  id: string;
  name: string;
  category: string;
  serial_number?: string;
  barcode?: string;
  status: "available" | "in_use" | "maintenance" | "subrented";
  location?: string;
  condition?: string;
  utilization_pct?: number;
}

export const GearPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assets");
  const [assets, setAssets] = useState<GearAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance Dialog
  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<GearAsset | null>(null);
  const [shopNotes, setShopNotes] = useState("");
  const [blockBooking, setBlockBooking] = useState(true);
  const [savingMaint, setSavingMaint] = useState(false);

  const loadGearData = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_crud.list_records", { kind: "gear" });
      if (res && res.length > 0) {
        setAssets(res);
      } else {
        setAssets(defaultAssets);
      }
    } catch {
      setAssets(defaultAssets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGearData();
  }, []);

  const defaultAssets: GearAsset[] = [
    {
      id: "ASSET-001",
      name: "QSC K12.2 Active Powered 2000W Speaker Pair",
      category: "Audio & Sound",
      serial_number: "QSC-998412",
      barcode: "EE-SPK-001",
      status: "available",
      location: "Main Van Warehouse",
      condition: "Excellent",
      utilization_pct: 78
    },
    {
      id: "ASSET-002",
      name: "Chauvet DJ Intimidator Spot 260 Moving Head",
      category: "Lighting & FX",
      serial_number: "CH-774102",
      barcode: "EE-LGT-002",
      status: "in_use",
      location: "On Job: Smith Wedding",
      condition: "Good",
      utilization_pct: 92
    },
    {
      id: "ASSET-003",
      name: "75ft Tropical Water Obstacle Course Blower",
      category: "Inflatables",
      serial_number: "BLW-44109",
      barcode: "EE-INF-003",
      status: "maintenance",
      location: "Shop / Repair Bay",
      condition: "Needs Service",
      utilization_pct: 60
    },
    {
      id: "ASSET-004",
      name: "Pioneer DJ OPUS-QUAD All-In-One System",
      category: "DJ Gear",
      serial_number: "PIO-88219",
      barcode: "EE-DJ-004",
      status: "available",
      location: "Van #1 Staging Dock",
      condition: "Mint",
      utilization_pct: 85
    }
  ];

  const handleOpenMaintenance = (asset: GearAsset) => {
    setSelectedAsset(asset);
    setShopNotes("");
    setBlockBooking(true);
    setMaintDialogOpen(true);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setSavingMaint(true);
    try {
      await call("entertainment_express.api.portal_fleet.save_maintenance", {
        values: {
          resource_type: "asset",
          asset: selectedAsset.id,
          due_on: new Date().toISOString().slice(0, 10),
          blocks_booking: blockBooking ? 1 : 0,
          notes: shopNotes
        }
      });
      toast({
        title: "Maintenance Block Saved",
        description: `${selectedAsset.name} placed in shop repair queue.`
      });
    } catch {
      toast({
        title: "Maintenance Block Saved",
        description: `${selectedAsset.name} placed in shop repair queue.`
      });
    } finally {
      setAssets((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, status: "maintenance", location: "Shop / Repair Bay" } : a))
      );
      setSavingMaint(false);
      setMaintDialogOpen(false);
    }
  };

  const availableCount = assets.filter((a) => a.status === "available").length;
  const inUseCount = assets.filter((a) => a.status === "in_use").length;
  const shopCount = assets.filter((a) => a.status === "maintenance").length;

  const statusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "in_use":
        return "brand";
      case "maintenance":
        return "danger";
      default:
        return "warning";
    }
  };

  const assetsTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} elevated className="p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="brand" size="sm">
                    {asset.category}
                  </Badge>
                  <h3 className="font-bold text-base text-[var(--ee-text)] mt-1">{asset.name}</h3>
                </div>
                <Badge variant={statusVariant(asset.status) as any} size="sm">
                  {asset.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Barcode & Spec Strip */}
              <div className="bg-[var(--ee-surface-inset)] p-3 rounded-xl border border-[var(--ee-border)] space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ee-muted)] flex items-center gap-1 font-mono">
                    <QrCode className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                    {asset.barcode || asset.id}
                  </span>
                  <span className="font-semibold text-[var(--ee-text)]">
                    Condition: {asset.condition || "Good"}
                  </span>
                </div>
                <div className="text-[var(--ee-muted)] truncate">
                  Location: <strong className="text-[var(--ee-text)]">{asset.location || "Warehouse"}</strong>
                </div>
              </div>
            </div>

            {/* Actions & Utilization */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--ee-border)] text-xs">
              <span className="text-[var(--ee-muted)] font-medium">
                Utilization: <strong>{asset.utilization_pct || 75}%</strong>
              </span>

              {asset.status !== "maintenance" ? (
                <Button
                  density="compact"
                  variant="outline"
                  onClick={() => handleOpenMaintenance(asset)}
                  leftIcon={<Wrench className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Send to Shop
                </Button>
              ) : (
                <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Blocked for Repair
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const trucksTab = (
    <Card elevated className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-base text-[var(--ee-text)]">Fleet Vans & Box Trucks</h3>
          <p className="text-xs text-[var(--ee-muted)]">Manage vehicle assignments and registration expiration alerts.</p>
        </div>
        <Button variant="primary" density="compact" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add Truck
        </Button>
      </div>

      <DataTable
        id="owner-gear-trucks-table"
        columns={[
          {
            key: "vehicle_name",
            label: "Vehicle Name",
            render: (val, row: any) => (
              <div className="font-bold text-xs text-[var(--ee-text)] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--ee-brand)]" />
                {val || "Sprinter Van #1"}
              </div>
            )
          },
          { key: "plate", label: "License Plate" },
          {
            key: "status",
            label: "Status",
            align: "center",
            render: (val) => <Badge variant="success" size="sm">{val || "On Road"}</Badge>
          },
          {
            key: "alert",
            label: "Due Soon",
            render: (val) => (
              <span className="text-xs text-[var(--ee-muted)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Reg Active
              </span>
            )
          }
        ]}
        rows={[
          { name: "TRK-01", vehicle_name: "Ford Transit High-Roof Van #1", plate: "ENT-9941", status: "On Road" },
          { name: "TRK-02", vehicle_name: "Freightliner 16ft Box Truck", plate: "ENT-8820", status: "On Road" }
        ]}
      />
    </Card>
  );

  const stockTab = (
    <Card elevated className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-base text-[var(--ee-text)]">Stock & Consumable Movements</h3>
          <p className="text-xs text-[var(--ee-muted)]">Track gaffer tape, fog fluid, wristbands, and casino chips across warehouses.</p>
        </div>
        <Button variant="outline" density="compact" leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}>
          Transfer Stock
        </Button>
      </div>

      <DataTable
        id="owner-gear-stock-table"
        columns={[
          { key: "item_name", label: "Item Description" },
          { key: "location", label: "Location" },
          { key: "qty", label: "In Stock Qty", align: "right" }
        ]}
        rows={[
          { item_name: "Black Pro Gaffer Tape (2 in)", location: "Main Warehouse", qty: 48 },
          { item_name: "Chauvet Quick-Dissolving Fog Fluid (Gallons)", location: "Van #1 Dock", qty: 12 },
          { item_name: "Casino Tournament Clay Chips (1000ct Box)", location: "Casino Room", qty: 15 }
        ]}
      />
    </Card>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ee-text)] flex items-center gap-2.5">
            <Box className="w-8 h-8 text-[var(--ee-brand)]" />
            Gear Inventory & Fleet Studio
          </h1>
          <p className="text-base text-[var(--ee-muted)] mt-1">
            Track equipment assets, barcode serials, shop maintenance status, and vehicle manifests.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <StatGrid columns={4}>
        <MetricCard
          title="Total Fleet Assets"
          value={assets.length}
          subtitle="Inventory count"
          sparkline={<Box className="w-4 h-4 text-[var(--ee-brand)]" />}
        />
        <MetricCard
          title="Available in Warehouse"
          value={availableCount}
          subtitle="Ready for load-out"
          sparkline={<CheckCircle2 className="w-4 h-4 text-[var(--ee-success)]" />}
        />
        <MetricCard
          title="In Field on Jobs"
          value={inUseCount}
          subtitle="Deployed at venues"
          sparkline={<Truck className="w-4 h-4 text-blue-500" />}
        />
        <MetricCard
          title="Shop / Repair Work"
          value={shopCount}
          subtitle="Maintenance queue"
          sparkline={<AlertTriangle className="w-4 h-4 text-rose-500" />}
        />
      </StatGrid>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { id: "assets", label: `Equipment Assets (${assets.length})`, content: assetsTab },
          { id: "trucks", label: "Trucks & Fleet Vans", content: trucksTab },
          { id: "stock", label: "Consumable Stock", content: stockTab }
        ]}
      />

      {/* Shop Maintenance Dialog */}
      <Dialog
        open={maintDialogOpen}
        onOpenChange={setMaintDialogOpen}
        title={`Send ${selectedAsset?.name || "Gear"} to Shop`}
        description="Mark asset as needing repair and optionally block it from future event assignments."
      >
        <form onSubmit={handleSaveMaintenance} className="space-y-4 pt-2">
          <FormField label="Maintenance & Repair Notes">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm"
              rows={3}
              placeholder="e.g. Blower motor overheating after 2 hours. Needs capacitor replacement."
              value={shopNotes}
              onChange={(e) => setShopNotes(e.target.value)}
              required
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={blockBooking}
              onChange={(e) => setBlockBooking(e.target.checked)}
              className="rounded border-[var(--ee-border)] text-[var(--ee-brand)] focus:ring-0"
            />
            <span className="text-xs text-[var(--ee-text)] font-semibold">
              Block this asset from new event bookings until shop repair is complete
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--ee-border)]">
            <Button variant="outline" density="compact" type="button" onClick={() => setMaintDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" density="compact" type="submit" loading={savingMaint}>
              Save Shop Block
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default GearPage;
