import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { OwnerApp } from "./App";
import "../../portal-kit/src/tokens.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <OwnerApp />
    </BrowserRouter>
  </React.StrictMode>
);
