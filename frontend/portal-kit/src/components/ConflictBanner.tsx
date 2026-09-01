import React from "react";

export function ConflictBanner({
  title,
  message,
  severity = "potential",
}: {
  title: string;
  message: string;
  severity?: "actual" | "potential";
}) {
  const color = severity === "actual" ? "var(--ee-danger, #b42318)" : "var(--ee-warning, #b54708)";
  return (
    <aside
      role="status"
      style={{
        border: `1px solid ${color}`,
        borderRadius: "0.5rem",
        padding: "0.75rem 1rem",
        color,
      }}
    >
      <strong style={{ display: "block" }}>{title}</strong>
      <span>{message}</span>
    </aside>
  );
}
