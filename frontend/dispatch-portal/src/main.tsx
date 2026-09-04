import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../../portal-kit/src";
import { DispatchBoard } from "./DispatchBoard";
import "../../portal-kit/src/tokens.css";
import "./index.css";

const queryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DispatchBoard />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

