import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientApp } from "./App";
import "../../portal-kit/src/tokens.css";

const queryClient = new QueryClient();

const isDev = import.meta.env.DEV;
const basename = isDev ? "/assets/entertainment_express/client" : "/client";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <ClientApp />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
