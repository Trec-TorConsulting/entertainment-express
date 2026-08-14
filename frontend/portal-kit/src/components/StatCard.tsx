import React from "react";

type Props = {
  label: string;
  value: string;
  compact?: boolean;
};

export function StatCard({ label, value, compact }: Props) {
  return (
    <article style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", boxShadow: "var(--ee-shadow)", padding: compact ? "0.65rem" : "0.9rem" }}>
      <p style={{ margin: 0, color: "var(--ee-muted)", fontSize: compact ? "0.75rem" : "0.9rem" }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: compact ? "1.15rem" : "1.5rem", fontWeight: 700 }}>{value}</p>
    </article>
  );
}
