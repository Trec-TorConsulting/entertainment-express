import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@portal-kit";
import { OwnerApp } from "./App";
import "../../portal-kit/src/tokens.css";

const isDev = import.meta.env.DEV;
const basename = isDev ? "/assets/entertainment_express/owner" : "/owner";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <OwnerApp />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
