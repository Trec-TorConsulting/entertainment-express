import React from "react";
import { getSessionBootstrap } from "../api/session";
import "./AppShell.css";

type Density = "ops" | "cockpit" | "consumer";

type Props = {
  title: string;
  density?: Density;
  sidebar?: React.ReactNode;
  bottom?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, density = "cockpit", sidebar, bottom, headerExtra, children }: Props) {
  const branding = getSessionBootstrap().branding;
  const brandColor = branding?.color;

  React.useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--ee-brand", brandColor);
    }
  }, [brandColor]);

  const densityClass = density === "ops" ? " ee-shell--ops" : density === "consumer" ? " ee-shell--consumer" : "";

  return (
    <div className={`ee-shell${densityClass}`}>
      <header className="ee-shell__header">
        <strong>{title}</strong>
        {branding?.name ? <span style={{ color: "var(--ee-muted)" }}>{branding.name}</span> : null}
        {headerExtra ? <div className="ee-shell__header-extra">{headerExtra}</div> : null}
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
