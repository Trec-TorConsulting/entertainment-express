import React, { useState } from "react";

type Props = {
  onSearch: (query: string) => void;
};

export function CommandPalette({ onSearch }: Props) {
  const [query, setQuery] = useState("");

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <input
        value={query}
        placeholder="Search bookings, customers, tasks"
        onChange={(e) => setQuery(e.target.value)}
        style={{ flex: 1, padding: "0.5rem", border: "1px solid #d9dee5", borderRadius: "0.5rem" }}
      />
      <button onClick={() => onSearch(query)} style={{ padding: "0.5rem 0.8rem" }}>
        Go
      </button>
    </div>
  );
}
