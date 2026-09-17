import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OwnerLayout } from "./layouts/OwnerLayout";
import { Skeleton, EmptyState, AccountPanel } from "@portal-kit";

// Flagship Route Modules - Statically imported for immediate, reliable rendering
import { TodayPage } from "./routes/today/TodayPage";
import { PipelinePage } from "./routes/pipeline/PipelinePage";
import { MoneyPage } from "./routes/money/MoneyPage";
import { PayrollSettlementPage } from "./routes/money/PayrollSettlementPage";
import { BrandPage } from "./routes/brand/BrandPage";
import { SubcontractorsPage } from "./routes/subcontractors/SubcontractorsPage";
import { WebsitePage } from "./routes/website/WebsitePage";
import { FleetHealthPage } from "./routes/fleet/FleetHealthPage";
import { VanManifestPage } from "./routes/fleet/VanManifestPage";
import { CompanyStudioPage } from "./routes/settings/CompanyStudioPage";
import { MasterDataPage } from "./routes/admin/MasterDataPage";
import { EmergencyOverridesPage } from "./routes/operations/EmergencyOverridesPage";
import { EventDetailsPage } from "./routes/operations/EventDetailsPage";
import { CalendarPage } from "./routes/operations/CalendarPage";
import { SchedulePage } from "./routes/operations/SchedulePage";
import { CatalogPage } from "./routes/catalog/CatalogPage";
import { GearPage } from "./routes/fleet/GearPage";
import { PlacesPage } from "./routes/operations/PlacesPage";
import { PartnersPage } from "./routes/subcontractors/PartnersPage";

// Statically import Legacy Workspaces to eliminate chunk mismatches
import LegacyWorkspaces from "../AppLegacy";

const RouteFallback = () => (
  <div className="p-6 space-y-4">
    <Skeleton width="200px" height="2rem" />
    <Skeleton height="8rem" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
    </div>
  </div>
);

export const OwnerApp: React.FC = () => {
  return (
    <OwnerLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Flagship Routes */}
          <Route path="/" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/gear" element={<GearPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/pipeline/new" element={<Navigate to="/pipeline?new=1" replace />} />
          <Route path="/pipeline/:id/proposal" element={<LegacyWorkspaces />} />
          <Route path="/pipeline/:id" element={<LegacyWorkspaces />} />
          <Route path="/fleet" element={<FleetHealthPage />} />
          <Route path="/fleet/vans" element={<VanManifestPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/money/payroll" element={<PayrollSettlementPage />} />
          <Route path="/subcontractors" element={<SubcontractorsPage />} />
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/website" element={<WebsitePage />} />
          <Route path="/event-details" element={<EventDetailsPage />} />
          <Route path="/operations/event-details" element={<EventDetailsPage />} />
          <Route path="/settings/website" element={<WebsitePage />} />
          <Route path="/settings/studio" element={<CompanyStudioPage />} />
          <Route path="/settings" element={<Navigate to="/settings/studio" replace />} />
          <Route path="/admin/data" element={<MasterDataPage />} />
          <Route path="/operations/overrides" element={<EmergencyOverridesPage />} />
          <Route path="/account" element={<AccountPanel />} />

          {/* Legacy / Operational Workspaces */}
          <Route path="/*" element={<LegacyWorkspaces />} />
        </Routes>
      </Suspense>
    </OwnerLayout>
  );
};

export default OwnerApp;
