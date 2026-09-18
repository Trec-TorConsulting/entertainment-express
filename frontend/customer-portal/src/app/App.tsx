import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ClientLayout } from "./layouts/ClientLayout";

import { HomePage } from "./routes/home/HomePage";
import { EventsListPage } from "./routes/events/EventsListPage";
import { EventDetailPage } from "./routes/event/EventDetailPage";
import { PayPage } from "./routes/pay/PayPage";
import { PlanningPage } from "./routes/planning/PlanningPage";
import { DocumentsPage } from "./routes/documents/DocumentsPage";
import { AppointmentsPage } from "./routes/appointments/AppointmentsPage";
import { PeoplePage } from "./routes/people/PeoplePage";
import { ChatPage } from "./routes/chat/ChatPage";
import { PhotosPage } from "./routes/photos/PhotosPage";
import { AccountPage } from "./routes/account/AccountPage";

export const ClientApp: React.FC = () => {
  return (
    <ClientLayout>
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
    </ClientLayout>
  );
};

export default ClientApp;
