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
  const bootstrap = getSessionBootstrap();
  const branding = bootstrap.branding;
  const brandColor = branding?.color;
  const company = branding?.name || title;
  const hideProduct = Boolean(branding?.hide_product_chrome);

  React.useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--ee-brand", brandColor);
    }
    if (branding?.color_secondary) {
      document.documentElement.style.setProperty("--ee-brand-2", branding.color_secondary);
    }
    if (branding?.color_accent) {
      document.documentElement.style.setProperty("--ee-accent", branding.color_accent);
    }
    if (branding?.color_bg) {
      document.documentElement.style.setProperty("--ee-bg", branding.color_bg);
    }
    if (branding?.color_text) {
      document.documentElement.style.setProperty("--ee-text", branding.color_text);
    }
    if (branding?.favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.favicon;
    }
    document.title = hideProduct ? company : `${company} · ${title}`;
    document.documentElement.classList.toggle("ee-hide-product", hideProduct);
  }, [
    brandColor,
    branding?.color_secondary,
    branding?.color_accent,
    branding?.color_bg,
    branding?.color_text,
    branding?.favicon,
    company,
    hideProduct,
    title,
  ]);

  const densityClass = density === "ops" ? " ee-shell--ops" : density === "consumer" ? " ee-shell--consumer" : "";
  const links = LINKS[portal];

  return (
    <div className={`ee-shell${densityClass}${hideProduct ? " ee-shell--white-label" : ""}`}>
      <aside className="ee-shell__rail">
        <a className="ee-brand" href={`/${portal}`}>
          {branding?.logo ? <img src={branding.logo} alt="" /> : <span className="ee-brand__mark">{(company || "EE").slice(0, 2).toUpperCase()}</span>}
          <span className="ee-brand__text">
            <strong>{company}</strong>
            {hideProduct ? null : <em>{title}</em>}
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
