import React from "react";
import { Route, Routes } from "react-router-dom";
import { EmployeeLayout } from "./layouts/EmployeeLayout";

import { MyDayPage } from "./routes/today/MyDayPage";
import { DispatchEmbedPage } from "./routes/dispatch/DispatchEmbedPage";
import { MyEarningsPage } from "./routes/earnings/MyEarningsPage";
import { MyProfilePage } from "./routes/profile/MyProfilePage";
import LegacyEmployeeWorkspaces from "../AppLegacy";

export const EmployeeApp: React.FC = () => {
  return (
    <EmployeeLayout>
      <Routes>
        {/* Flagship Routes */}
        <Route path="/" element={<MyDayPage />} />
        <Route path="/dispatch" element={<DispatchEmbedPage />} />
        <Route path="/earnings" element={<MyEarningsPage />} />
        <Route path="/me" element={<MyProfilePage />} />

        {/* Operational & Legacy Routes */}
        <Route path="/*" element={<LegacyEmployeeWorkspaces />} />
      </Routes>
    </EmployeeLayout>
  );
};

export default EmployeeApp;
