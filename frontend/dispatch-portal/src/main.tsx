import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchBoard } from "./DispatchBoard";
import "../../portal-kit/src/tokens.css";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DispatchBoard />
    </QueryClientProvider>
  </React.StrictMode>
);
