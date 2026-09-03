import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { EmployeeLayout } from "./layouts/EmployeeLayout";
import { Skeleton } from "@portal-kit";

// Flagship Route Modules - Lazy Loaded
const MyDayPage = React.lazy(() => import("./routes/today/MyDayPage").then((m) => ({ default: m.MyDayPage })));
const DispatchEmbedPage = React.lazy(() => import("./routes/dispatch/DispatchEmbedPage").then((m) => ({ default: m.DispatchEmbedPage })));
const LegacyEmployeeWorkspaces = React.lazy(() => import("../AppLegacy"));

const RouteFallback = () => (
  <div className="p-4 space-y-4">
    <Skeleton width="180px" height="2rem" />
    <Skeleton height="8rem" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton height="5rem" />
      <Skeleton height="5rem" />
    </div>
  </div>
);

export const EmployeeApp: React.FC = () => {
  return (
    <EmployeeLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Flagship Routes */}
          <Route path="/" element={<MyDayPage />} />
          <Route path="/dispatch" element={<DispatchEmbedPage />} />

          {/* Operational & Legacy Routes */}
          <Route path="/*" element={<LegacyEmployeeWorkspaces />} />
        </Routes>
      </Suspense>
    </EmployeeLayout>
  );
};

export default EmployeeApp;
