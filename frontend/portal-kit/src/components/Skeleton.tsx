import React from "react";

export function Skeleton({ height = 18 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: "0.5rem",
        background: "linear-gradient(90deg, #f0f2f5, #e2e8ef, #f0f2f5)",
        backgroundSize: "200% 100%"
      }}
    />
  );
}
