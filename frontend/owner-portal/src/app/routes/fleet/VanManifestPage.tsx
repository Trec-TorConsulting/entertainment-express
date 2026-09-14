import React, { useEffect, useState } from "react";
import {
  PageHeader,
  Card,
  DataTable,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  call,
  useToast,
} from "@portal-kit";
import {
  Truck,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Barcode,
} from "lucide-react";

interface VehicleOverview {
  name: string;
  vehicle_name: string;
  plate: string;
  linked_warehouse?: string;
  status: string;
  max_payload_lb?: number;
}

interface ManifestData {
  vehicle: string;
  vehicle_name: string;
  plate: string;
  van_warehouse: string;
  status: string;
  capacity_lb?: number;
  total_items: number;
  items: Array<{
    asset: string;
    asset_name: string;
    item_code: string;
    status: string;
    condition: string;
    barcode: string;
  }>;
  recent_loadouts: Array<{
    name: string;
    booking: string;
    completed_at: string;
  }>;
}

export const VanManifestPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleOverview[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.portal_crud.list_records", {
        kind: "vehicle",
      });
      const list = res?.rows || [];
      setVehicles(list);
      if (list.length > 0 && !selectedVehicle) {
        setSelectedVehicle(list[0].name);
      }
    } catch (err: any) {
      toast({
        title: "Error loading fleet vehicles",
        description: err?.message || "Could not fetch vehicles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchManifest = async (vehId: string) => {
    setManifestLoading(true);
    try {
      const res = await call("entertainment_express.api.logistics.get_vehicle_manifest", {
        vehicle_name: vehId,
      });
      setManifest(res);
    } catch (err: any) {
      toast({
        title: "Manifest Error",
        description: err?.message || "Failed to load van manifest.",
        variant: "destructive",
      });
    } finally {
      setManifestLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchManifest(selectedVehicle);
    }
  }, [selectedVehicle]);

  const filteredItems = (manifest?.items || []).filter(
    (it) =>
      it.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.asset?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Fleet Van Manifests"
        subtitle="Real-time Van-as-a-Warehouse rolling equipment inventories and loadout tracking."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedVehicle) fetchManifest(selectedVehicle);
            }}
            disabled={manifestLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${manifestLoading ? "animate-spin" : ""}`} />
            Refresh Manifest
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton height="300px" />
          <Skeleton className="md:col-span-3" height="300px" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<Truck className="w-12 h-12 text-slate-400" />}
            title="No Fleet Vehicles Configured"
            description="Add vehicles to your fleet to begin tracking mobile van warehouses."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Vehicle Selector Column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Fleet Trucks & Vans ({vehicles.length})
            </h3>
            <div className="space-y-2">
              {vehicles.map((veh) => {
                const isSelected = selectedVehicle === veh.name;
                return (
                  <button
                    key={veh.name}
                    onClick={() => setSelectedVehicle(veh.name)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {veh.vehicle_name || veh.name}
                      </span>
                      <Badge variant={veh.status === "active" ? "default" : "outline"} className="text-xs">
                        {veh.status || "active"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Truck className="w-3.5 h-3.5" />
                      <span>{veh.plate || "No Plate"}</span>
                      {veh.max_payload_lb && <span>· {veh.max_payload_lb} lb</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Van Manifest & Content Details */}
          <div className="md:col-span-3 space-y-6">
            {manifestLoading || !manifest ? (
              <Card className="p-8">
                <Skeleton height="150px" />
                <Skeleton className="mt-4" height="200px" />
              </Card>
            ) : (
              <>
                {/* Van Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Warehouse Entity</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {manifest.van_warehouse}
                    </p>
                  </Card>
                  <Card className="p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Current Loaded Assets</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {manifest.total_items} units
                    </p>
                  </Card>
                  <Card className="p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Payload Capacity</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {manifest.capacity_lb ? `${manifest.capacity_lb} lbs` : "Standard Cargo"}
                    </p>
                  </Card>
                </div>

                {/* Items in Van */}
                <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Loaded Equipment & Stage Assets
                      </h3>
                      <p className="text-xs text-slate-500">
                        Serialized gear currently onboard this mobile warehouse
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search gear or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      {manifest.items.length === 0
                        ? "Van is currently empty. Gear loaded via Scan-to-Truck will appear here."
                        : "No assets match your search filter."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3">Asset</th>
                            <th className="px-4 py-3">Barcode / Tag</th>
                            <th className="px-4 py-3">Item Code</th>
                            <th className="px-4 py-3">Condition</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredItems.map((row) => (
                            <tr key={row.asset} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {row.asset_name}
                                <span className="block text-xs text-slate-400 font-mono">{row.asset}</span>
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  <Barcode className="w-3.5 h-3.5" />
                                  {row.barcode || "No Barcode"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{row.item_code || "—"}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {row.condition || "good"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Badge
                                  variant={row.status === "in_transit" ? "default" : "secondary"}
                                  className="capitalize text-xs"
                                >
                                  {row.status || "loaded"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VanManifestPage;
