import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@portal-kit";
import { ClientApp } from "./App";
import "../../portal-kit/src/tokens.css";

const queryClient = new QueryClient();

const isDev = import.meta.env.DEV;
const pathname = typeof window !== "undefined" ? window.location.pathname : "";
const basename = isDev
  ? "/assets/entertainment_express/client"
  : pathname.startsWith("/client")
  ? "/client"
  : "/";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <ClientApp />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

