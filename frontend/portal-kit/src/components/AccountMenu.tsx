import React from "react";
import { call } from "../api/client";
import { getSessionBootstrap } from "../api/session";
import { FormField } from "./FormField";
import { User, Settings, LogOut, Inbox, CheckCircle2 } from "lucide-react";

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
    <div className="relative inline-block text-left" ref={wrap}>
      <button
        type="button"
        className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] hover:bg-[var(--ee-surface-inset)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ee-brand)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {person.image ? (
          <img src={person.image} alt="" className="w-7 h-7 rounded-full object-cover border border-[var(--ee-border)]" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[var(--ee-brand-soft,rgba(59,130,246,0.1))] text-[var(--ee-brand,#2563eb)] flex items-center justify-center text-xs font-semibold">
            {initials(person.full_name || "You")}
          </span>
        )}
        <span className="hidden sm:flex flex-col text-left leading-tight">
          <strong className="text-xs font-medium text-[var(--ee-text)] truncate max-w-[120px]">{person.full_name || "You"}</strong>
          <em className="not-italic text-[10px] text-[var(--ee-muted)] truncate max-w-[120px]">{person.email || ""}</em>
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-[var(--ee-border)] bg-[var(--ee-panel,#ffffff)] shadow-xl py-1.5 z-50 flex flex-col divide-y divide-[var(--ee-border)] animate-in fade-in-50 zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-3 py-2 sm:hidden">
            <p className="text-xs font-medium text-[var(--ee-text)] truncate">{person.full_name || "You"}</p>
            <p className="text-[10px] text-[var(--ee-muted)] truncate">{person.email || ""}</p>
          </div>
          <div className="py-1 flex flex-col">
            <a
              href={accountHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
              <span>Profile & security</span>
            </a>
            {settingsHref ? (
              <a
                href={settingsHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[var(--ee-muted)]" />
                <span>Company settings</span>
              </a>
            ) : null}
          </div>
          <div className="py-1 flex flex-col">
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut()}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
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
    <div className="relative inline-block text-left" ref={wrap}>
      <button
        type="button"
        className="relative p-1.5 rounded-lg border border-[var(--ee-border)] text-[var(--ee-muted)] hover:text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-colors"
        aria-label="Inbox"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <Inbox className="w-4 h-4" />
        {count ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 text-[10px] font-bold min-w-[16px] text-center leading-4 shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-[var(--ee-border)] bg-[var(--ee-panel,#ffffff)] shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100 flex flex-col"
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-[var(--ee-border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--ee-text)]">Notifications & Tasks</span>
            {count ? <span className="text-[10px] text-[var(--ee-muted)]">{count} unread</span> : null}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-[var(--ee-border)]">
            {items.length ? (
              items.map((row) => (
                <div key={row.id} className="p-3 hover:bg-[var(--ee-surface-inset)] flex items-start justify-between gap-2 transition-colors">
                  <div className="flex flex-col text-left">
                    <strong className="text-xs font-medium text-[var(--ee-text)]">{row.title}</strong>
                    <span className="text-[10px] text-[var(--ee-muted)]">{row.when || "Open"}</span>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-1 text-[11px] font-medium rounded-md border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] hover:bg-[var(--ee-surface-inset)] text-[var(--ee-text)] transition-colors"
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
              <p className="p-4 text-xs text-center text-[var(--ee-muted)]">Nothing waiting. Assigned tasks show up here.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AccountPanel() {
  const boot = getSessionBootstrap();
  const person = boot.person || { full_name: boot.user, email: boot.user, name: boot.user };
  const roles = (boot.roles || []).filter((role) => role.startsWith("EE ") || role === "SaaS Operator");
  const [prefs, setPrefs] = React.useState<any>(null);
  const [hint, setHint] = React.useState("");
  React.useEffect(() => {
    call("entertainment_express.api.portal_notifications.get_my_preferences", {})
      .then(setPrefs)
      .catch(() => setPrefs(null));
  }, []);
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
      {prefs ? (
        <div className="ee-form" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0 }}>How we reach you</h2>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={!!prefs.email} onChange={() => setPrefs({ ...prefs, email: prefs.email ? 0 : 1 })} />
            Email
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={!!prefs.sms} onChange={() => setPrefs({ ...prefs, sms: prefs.sms ? 0 : 1 })} />
            Text
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={!!prefs.whatsapp} onChange={() => setPrefs({ ...prefs, whatsapp: prefs.whatsapp ? 0 : 1 })} />
            WhatsApp
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={!!prefs.push} onChange={() => setPrefs({ ...prefs, push: prefs.push ? 0 : 1 })} />
            Phone alerts
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            <FormField label="Quiet from">
              <input type="time" value={prefs.quiet_from || ""} onChange={(e) => setPrefs({ ...prefs, quiet_from: e.target.value })} />
            </FormField>
            <FormField label="Quiet until">
              <input type="time" value={prefs.quiet_to || ""} onChange={(e) => setPrefs({ ...prefs, quiet_to: e.target.value })} />
            </FormField>
          </div>
          {hint ? <p>{hint}</p> : null}
          <button
            type="button"
            className="ee-btn"
            onClick={async () => {
              await call("entertainment_express.api.portal_notifications.save_my_preferences", { values: prefs });
              setHint("Saved.");
            }}
          >
            Save message settings
          </button>
        </div>
      ) : null}
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
