import React from "react";

type Column<T> = { key: keyof T; label: string };

type Props<T> = {
  id?: string;
  columns: Array<Column<T>>;
  rows: T[];
};

export function DataTable<T extends Record<string, any>>({ id = "default", columns, rows }: Props<T>) {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [search, setSearch] = React.useState("");
  const [savedViews, setSavedViews] = React.useState<string[]>([]);
  const storageKey = `ee-table-view:${id}`;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setSavedViews(parsed);
    } catch (_err) {
      setSavedViews([]);
    }
  }, [storageKey]);

  const filteredRows = rows.filter((row) => {
    if (!search.trim()) {
      return true;
    }
    const haystack = columns.map((col) => String(row[col.key] ?? "")).join(" ").toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const saveCurrentView = () => {
    if (!search.trim()) {
      return;
    }
    const next = Array.from(new Set([...savedViews, search.trim()]));
    setSavedViews(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const toggleRow = (rowKey: string) => {
    setSelected((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter rows"
          style={{ padding: "0.5rem", border: "1px solid #d9dee5", borderRadius: "0.5rem", minWidth: 220 }}
        />
        <button onClick={saveCurrentView} style={{ padding: "0.5rem 0.8rem" }}>Save View</button>
        {savedViews.map((view) => (
          <button key={view} onClick={() => setSearch(view)} style={{ padding: "0.5rem 0.8rem" }}>
            {view}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "var(--ee-muted)" }}>Selected: {selectedCount}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--ee-panel)" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #d9dee5", padding: "0.65rem" }}>Pick</th>
            {columns.map((col) => (
              <th key={String(col.key)} style={{ textAlign: "left", borderBottom: "1px solid #d9dee5", padding: "0.65rem" }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, idx) => {
            const rowKey = String((row as any).name || idx);
            return (
              <tr key={rowKey}>
                <td style={{ borderBottom: "1px solid #eef1f4", padding: "0.65rem" }}>
                  <input type="checkbox" checked={!!selected[rowKey]} onChange={() => toggleRow(rowKey)} />
                </td>
                {columns.map((col) => (
                  <td key={String(col.key)} style={{ borderBottom: "1px solid #eef1f4", padding: "0.65rem" }}>
                    {String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
