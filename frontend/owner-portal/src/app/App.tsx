import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OwnerLayout } from "./layouts/OwnerLayout";
import { Skeleton, EmptyState, AccountPanel } from "@portal-kit";

// Flagship Route Modules - Statically imported for immediate, reliable rendering
import { TodayPage } from "./routes/today/TodayPage";
import { PipelinePage } from "./routes/pipeline/PipelinePage";
import { MoneyPage } from "./routes/money/MoneyPage";
import { BrandPage } from "./routes/brand/BrandPage";

// Lazy-load Legacy Workspaces
const LegacyWorkspaces = React.lazy(() => import("../AppLegacy"));

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
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/settings" element={<Navigate to="/brand" replace />} />
          <Route path="/account" element={<AccountPanel />} />

          {/* Legacy / Operational Workspaces */}
          <Route path="/*" element={<LegacyWorkspaces />} />
        </Routes>
      </Suspense>
    </OwnerLayout>
  );
};

export default OwnerApp;
