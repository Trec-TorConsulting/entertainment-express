import React, { useEffect, useRef, useState } from "react";

type Props = {
  onSearch: (query: string) => void;
};

export function CommandPalette({ onSearch }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <input
        id="ee-command-search"
        ref={inputRef}
        value={query}
        aria-label="Search bookings, customers, and tasks"
        placeholder="Search bookings, customers, tasks — press /"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch(query);
        }}
        style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--ee-border)", borderRadius: "0.5rem", background: "var(--ee-panel)", color: "var(--ee-text)" }}
      />
      <button type="button" onClick={() => onSearch(query)} style={{ padding: "0.5rem 0.8rem", background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem" }}>
        Go
      </button>
    </div>
  );
}

export function focusCommandPalette() {
  document.getElementById("ee-command-search")?.focus();
}
