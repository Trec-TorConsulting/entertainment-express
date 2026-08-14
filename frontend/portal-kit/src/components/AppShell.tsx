import React from "react";
import { AccountMenu, HeaderSearch, InboxMenu } from "./AccountMenu";
import { getSessionBootstrap } from "../api/session";
import "./AppShell.css";

type Density = "ops" | "cockpit" | "consumer";

type Props = {
  title: string;
  portal: "owner" | "employee" | "client";
  density?: Density;
  sidebar?: React.ReactNode;
  bottom?: React.ReactNode;
  headerExtra?: React.ReactNode;
  showSearch?: boolean;
  children: React.ReactNode;
};

const LINKS = {
  owner: { account: "/owner/account", settings: "/owner/brand" },
  employee: { account: "/employee/me", settings: undefined as string | undefined },
  client: { account: "/client/account", settings: undefined as string | undefined },
};

export function AppShell({ title, portal, density = "cockpit", sidebar, bottom, headerExtra, showSearch = true, children }: Props) {
  const branding = getSessionBootstrap().branding;
  const brandColor = branding?.color;
  const company = branding?.name || title;

  React.useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--ee-brand", brandColor);
    }
  }, [brandColor]);

  const densityClass = density === "ops" ? " ee-shell--ops" : density === "consumer" ? " ee-shell--consumer" : "";
  const links = LINKS[portal];

  return (
    <div className={`ee-shell${densityClass}`}>
      <aside className="ee-shell__rail">
        <a className="ee-brand" href={`/${portal}`}>
          {branding?.logo ? <img src={branding.logo} alt="" /> : <span className="ee-brand__mark">{(company || "EE").slice(0, 2).toUpperCase()}</span>}
          <span className="ee-brand__text">
            <strong>{company}</strong>
            <em>{title}</em>
          </span>
        </a>
        <nav className="ee-shell__nav" aria-label="Primary">
          {sidebar}
        </nav>
      </aside>
      <div className="ee-shell__workspace">
        <header className="ee-shell__header">
          {showSearch ? <HeaderSearch /> : <div />}
          <div className="ee-shell__header-actions">
            {headerExtra}
            <InboxMenu />
            <AccountMenu accountHref={links.account} settingsHref={links.settings} />
          </div>
        </header>
        <main className="ee-shell__main">{children}</main>
      </div>
      {bottom ? (
        <nav className="ee-shell__bottom" aria-label="Mobile">
          {bottom}
        </nav>
      ) : null}
    </div>
  );
}
