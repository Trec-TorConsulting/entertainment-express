import React from "react";

type Props = {
  message: string;
};

export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", right: "1rem", bottom: "1rem", background: "var(--ee-text)", color: "#fff", padding: "0.6rem 0.8rem", borderRadius: "0.5rem" }}>
      {message}
    </div>
  );
}
