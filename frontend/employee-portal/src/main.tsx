import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeApp } from "./App";
import "../../portal-kit/src/tokens.css";

const queryClient = new QueryClient();

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/assets/entertainment_express/employee/sw.js").catch(() => undefined);
  });
}

const isDev = import.meta.env.DEV;
const basename = isDev ? "/assets/entertainment_express/employee" : "/employee";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={basename}>
            <EmployeeApp />
          </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
