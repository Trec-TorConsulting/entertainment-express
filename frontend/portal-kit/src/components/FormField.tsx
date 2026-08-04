import React from "react";

type Props = {
  label: string;
  children: React.ReactNode;
};

export function FormField({ label, children }: Props) {
  return (
    <label style={{ display: "grid", gap: "0.35rem" }}>
      <span style={{ color: "var(--ee-muted)", fontSize: "0.9rem" }}>{label}</span>
      {children}
    </label>
  );
}
