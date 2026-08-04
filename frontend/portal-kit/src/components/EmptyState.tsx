import React from "react";

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <section style={{ background: "var(--ee-panel)", border: "1px dashed #c4ccd6", borderRadius: "var(--ee-radius)", padding: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{message}</p>
      {actionLabel ? (
        <button onClick={onAction} style={{ background: "var(--ee-brand)", color: "#fff", border: 0, borderRadius: "0.5rem", padding: "0.5rem 0.8rem" }}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
