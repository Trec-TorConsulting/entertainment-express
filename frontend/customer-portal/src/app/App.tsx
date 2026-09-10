import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ClientLayout } from "./layouts/ClientLayout";
import { Skeleton } from "@portal-kit";

// Flagship & Modern Route Modules - Lazy Loaded
const HomePage = React.lazy(() => import("./routes/home/HomePage").then((m) => ({ default: m.HomePage })));
const EventsListPage = React.lazy(() => import("./routes/events/EventsListPage").then((m) => ({ default: m.EventsListPage })));
const EventDetailPage = React.lazy(() => import("./routes/event/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const PayPage = React.lazy(() => import("./routes/pay/PayPage").then((m) => ({ default: m.PayPage })));
const PlanningPage = React.lazy(() => import("./routes/planning/PlanningPage").then((m) => ({ default: m.PlanningPage })));
const DocumentsPage = React.lazy(() => import("./routes/documents/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const AppointmentsPage = React.lazy(() => import("./routes/appointments/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })));
const PeoplePage = React.lazy(() => import("./routes/people/PeoplePage").then((m) => ({ default: m.PeoplePage })));
const ChatPage = React.lazy(() => import("./routes/chat/ChatPage").then((m) => ({ default: m.ChatPage })));
const PhotosPage = React.lazy(() => import("./routes/photos/PhotosPage").then((m) => ({ default: m.PhotosPage })));
const AccountPage = React.lazy(() => import("./routes/account/AccountPage").then((m) => ({ default: m.AccountPage })));

const RouteFallback = () => (
  <div className="p-6 space-y-4 max-w-5xl mx-auto">
    <Skeleton width="240px" height="2.25rem" />
    <Skeleton height="10rem" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton height="8rem" />
      <Skeleton height="8rem" />
    </div>
  </div>
);

export const ClientApp: React.FC = () => {
  return (
    <ClientLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Main Workspaces */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/pay" element={<PayPage />} />
          <Route path="/planning" element={<PlanningPage />} />

          {/* Dedicated Production Workspaces */}
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ClientLayout>
  );
};

export default ClientApp;
