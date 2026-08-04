import React from "react";

type Props = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: Props) {
  return (
    <article style={{ background: "var(--ee-panel)", borderRadius: "var(--ee-radius)", boxShadow: "var(--ee-shadow)", padding: "0.9rem" }}>
      <p style={{ margin: 0, color: "var(--ee-muted)", fontSize: "0.9rem" }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
    </article>
  );
}
