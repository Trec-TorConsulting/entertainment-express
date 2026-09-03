import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ClientLayout } from "./layouts/ClientLayout";
import { Skeleton } from "@portal-kit";

// Flagship Route Modules - Lazy Loaded
const HomePage = React.lazy(() => import("./routes/home/HomePage").then((m) => ({ default: m.HomePage })));
const EventDetailPage = React.lazy(() => import("./routes/event/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const PayPage = React.lazy(() => import("./routes/pay/PayPage").then((m) => ({ default: m.PayPage })));
const PlanningPage = React.lazy(() => import("./routes/planning/PlanningPage").then((m) => ({ default: m.PlanningPage })));
const LegacyCustomerWorkspaces = React.lazy(() => import("../AppLegacy"));

const RouteFallback = () => (
  <div className="p-6 space-y-4">
    <Skeleton width="220px" height="2rem" />
    <Skeleton height="10rem" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton height="6rem" />
      <Skeleton height="6rem" />
    </div>
  </div>
);

export const ClientApp: React.FC = () => {
  return (
    <ClientLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Flagship Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/pay" element={<PayPage />} />
          <Route path="/planning" element={<PlanningPage />} />

          {/* Legacy Workspaces (Documents, Appointments, People, Chat, Photos, Account) */}
          <Route path="/*" element={<LegacyCustomerWorkspaces />} />
        </Routes>
      </Suspense>
    </ClientLayout>
  );
};

export default ClientApp;
