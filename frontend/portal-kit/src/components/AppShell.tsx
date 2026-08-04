import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ee-bg)", color: "var(--ee-text)" }}>
      <header style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #d9dee5", background: "var(--ee-panel)" }}>
        <strong>{title}</strong>
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
