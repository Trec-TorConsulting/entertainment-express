import React from "react";
import { getSessionBootstrap } from "../api/session";
import "./AppShell.css";

type Props = {
  title: string;
  density?: "ops" | "cockpit";
  sidebar?: React.ReactNode;
  bottom?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, density = "cockpit", sidebar, bottom, children }: Props) {
  const branding = getSessionBootstrap().branding;
  const brandColor = branding?.color;

  React.useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--ee-brand", brandColor);
    }
  }, [brandColor]);

  return (
    <div className={`ee-shell${density === "ops" ? " ee-shell--ops" : ""}`}>
      <header className="ee-shell__header">
        <strong>{title}</strong>
        {branding?.name ? <span style={{ color: "var(--ee-muted)" }}>{branding.name}</span> : null}
      </header>
      <nav className="ee-shell__nav" aria-label="Primary">
        {sidebar}
      </nav>
      <main className="ee-shell__main">{children}</main>
      {bottom ? (
        <nav className="ee-shell__bottom" aria-label="Mobile">
          {bottom}
        </nav>
      ) : null}
    </div>
  );
}
