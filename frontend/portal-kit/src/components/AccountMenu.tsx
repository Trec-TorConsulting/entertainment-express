import React from "react";
import { call } from "../api/client";
import { getSessionBootstrap } from "../api/session";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

async function signOut() {
  const csrf = getSessionBootstrap().csrf_token || "";
  try {
    await fetch("/api/method/logout", {
      method: "POST",
      credentials: "include",
      headers: { "X-Frappe-CSRF-Token": csrf },
    });
  } catch (_err) {
    /* still leave */
  }
  window.location.href = "/login";
}

type Props = {
  accountHref: string;
  settingsHref?: string;
};

export function AccountMenu({ accountHref, settingsHref }: Props) {
  const boot = getSessionBootstrap();
  const person = boot.person || { full_name: boot.user || "You", email: boot.user || "", image: undefined, name: boot.user };
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="ee-account" ref={wrap}>
      <button type="button" className="ee-account__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        {person.image ? (
          <img src={person.image} alt="" className="ee-avatar" />
        ) : (
          <span className="ee-avatar ee-avatar--fallback">{initials(person.full_name || "You")}</span>
        )}
        <span className="ee-account__meta">
          <strong>{person.full_name || "You"}</strong>
          <em>{person.email || ""}</em>
        </span>
      </button>
      {open ? (
        <div className="ee-menu" role="menu">
          <a href={accountHref} role="menuitem">
            Profile & security
          </a>
          {settingsHref ? (
            <a href={settingsHref} role="menuitem">
              Company settings
            </a>
          ) : null}
          <button type="button" role="menuitem" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function InboxMenu() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const count = getSessionBootstrap().inbox_count || 0;
  const wrap = React.useRef<HTMLDivElement>(null);

  const load = () => {
    call("entertainment_express.api.portal_chrome.list_inbox", {})
      .then((res) => setItems(res || []))
      .catch(() => setItems([]));
  };

  React.useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="ee-inbox" ref={wrap}>
      <button
        type="button"
        className="ee-icon-btn"
        aria-label="Inbox"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        Inbox
        {count ? <span className="ee-badge">{count > 99 ? "99+" : count}</span> : null}
      </button>
      {open ? (
        <div className="ee-menu ee-menu--wide" role="menu">
          {items.length ? (
            items.map((row) => (
              <div key={row.id} className="ee-menu__item">
                <strong>{row.title}</strong>
                <span>{row.when || "Open"}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await call("entertainment_express.api.portal_chrome.complete_task", { name: row.id });
                    load();
                  }}
                >
                  Done
                </button>
              </div>
            ))
          ) : (
            <p className="ee-menu__empty">Nothing waiting. Assigned tasks show up here.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AccountPanel() {
  const boot = getSessionBootstrap();
  const person = boot.person || { full_name: boot.user, email: boot.user, name: boot.user };
  const roles = (boot.roles || []).filter((role) => role.startsWith("EE ") || role === "SaaS Operator");
  return (
    <section className="ee-account-panel">
      <h1>Your profile</h1>
      <p className="ee-lead">Signed in through your company workspace. Password and 2FA stay on the login screen.</p>
      <dl>
        <div>
          <dt>Name</dt>
          <dd>{person.full_name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{person.email}</dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd>{roles.join(" · ") || "Workspace member"}</dd>
        </div>
      </dl>
      <button type="button" className="ee-btn ee-btn--ghost" onClick={() => signOut()}>
        Sign out
      </button>
    </section>
  );
}

export function HeaderSearch({ onPick }: { onPick?: (row: any) => void }) {
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<any[]>([]);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      document.getElementById("ee-command-search")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (value: string) => {
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    call("entertainment_express.api.portal_chrome.search", { query: value })
      .then((res) => setHits(res || []))
      .catch(() => setHits([]));
  };

  return (
    <div className="ee-search">
      <input
        id="ee-command-search"
        value={query}
        placeholder="Search events, clients, inquiries — /"
        aria-label="Search"
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => run(value), 180);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hits[0] && onPick) onPick(hits[0]);
        }}
      />
      {hits.length ? (
        <ul className="ee-search__hits">
          {hits.map((row) => (
            <li key={`${row.type}-${row.id}`}>
              <button
                type="button"
                onClick={() => {
                  onPick?.(row);
                  setHits([]);
                  setQuery("");
                }}
              >
                <strong>{row.label}</strong>
                <span>{row.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function exportInboxHint() {
  downloadText("inbox.txt", "Use the Inbox control in the header.", "text/plain");
}
