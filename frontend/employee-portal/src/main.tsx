import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeApp } from "./App";
import "../../portal-kit/src/tokens.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/employee">
            <EmployeeApp />
          </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
