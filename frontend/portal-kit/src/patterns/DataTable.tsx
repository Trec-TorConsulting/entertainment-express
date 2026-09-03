import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "../primitives/Input";
import { Checkbox } from "../primitives/Checkbox";
import { Skeleton } from "../primitives/Skeleton";
import { EmptyState } from "../components/EmptyState";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  width?: string | number;
}

export interface DataTableProps<T extends Record<string, any>> {
  id?: string;
  columns: Array<Column<T>>;
  rows: T[];
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => React.ReactNode;
  renderMobileCard?: (row: T, selected: boolean, toggleSelect: () => void) => React.ReactNode;
  selectable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  id = "default",
  columns,
  rows,
  onRowClick,
  renderActions,
  renderMobileCard,
  selectable = true,
  searchable = true,
  searchPlaceholder = "Search records...",
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "No data matches your current search or filter criteria.",
  className
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      return columns.some((col) => {
        const val = row[col.key as keyof T];
        return String(val ?? "").toLowerCase().includes(query);
      });
    });
  }, [rows, columns, search]);

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const compare = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? compare : -compare;
    });
  }, [filteredRows, sortKey, sortDir]);

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const next: Record<string, boolean> = {};
      sortedRows.forEach((r, idx) => {
        const key = String((r as any).name || (r as any).id || idx);
        next[key] = true;
      });
      setSelected(next);
    } else {
      setSelected({});
    }
  };

  const toggleRow = (rowKey: string) => {
    setSelected((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = sortedRows.length > 0 && selectedCount === sortedRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < sortedRows.length;

  if (loading) {
    return (
      <div className="space-y-3 p-4 bg-[var(--ee-surface-raised)] border border-[var(--ee-border)] rounded-xl">
        <Skeleton height="2rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
      </div>
    );
  }

  return (
    <div className={clsx("w-full space-y-3", className)}>
      {searchable && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              density="cockpit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
          {selectable && (
            <span className="text-xs text-[var(--ee-muted)] font-medium">
              {selectedCount > 0 ? `${selectedCount} selected` : `${sortedRows.length} total`}
            </span>
          )}
        </div>
      )}

      {sortedRows.length === 0 ? (
        <div className="border border-[var(--ee-border)] rounded-xl bg-[var(--ee-surface-raised)] p-8">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <>
          {/* Mobile Card Fallback (Hidden on md and up) */}
          <div className="block md:hidden space-y-3">
            {sortedRows.map((row, idx) => {
              const rowKey = String((row as any).name || (row as any).id || idx);
              const isRowSelected = Boolean(selected[rowKey]);

              if (renderMobileCard) {
                return (
                  <div key={rowKey}>
                    {renderMobileCard(row, isRowSelected, () => toggleRow(rowKey))}
                  </div>
                );
              }

              return (
                <div
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    "p-4 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-sm space-y-2.5",
                    onRowClick && "cursor-pointer active:bg-[var(--ee-surface-inset)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {selectable && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isRowSelected}
                          onCheckedChange={() => toggleRow(rowKey)}
                        />
                      </div>
                    )}
                    {renderActions && (
                      <div onClick={(e) => e.stopPropagation()} className="ml-auto">
                        {renderActions(row)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    {columns.map((col) => (
                      <div key={String(col.key)} className="flex items-baseline justify-between text-xs py-0.5">
                        <span className="text-[var(--ee-muted)]">{col.label}</span>
                        <span className="font-medium text-[var(--ee-text)] text-right">
                          {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--ee-surface-inset)] text-xs text-[var(--ee-muted)] border-b border-[var(--ee-border)] select-none">
                <tr>
                  {selectable && (
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={allSelected ? true : isIndeterminate ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const colKey = String(col.key);
                    const isSorted = sortKey === colKey;
                    const canSort = col.sortable !== false;

                    return (
                      <th
                        key={colKey}
                        style={col.width ? { width: col.width } : undefined}
                        onClick={() => canSort && handleSort(colKey)}
                        className={clsx(
                          "px-4 py-3 font-medium tracking-wider uppercase",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          canSort && "cursor-pointer hover:text-[var(--ee-text)] transition-colors"
                        )}
                      >
                        <div
                          className={clsx(
                            "inline-flex items-center gap-1.5",
                            col.align === "right" && "justify-end",
                            col.align === "center" && "justify-center"
                          )}
                        >
                          <span>{col.label}</span>
                          {canSort && (
                            <span className="shrink-0 text-[var(--ee-muted)]">
                              {isSorted ? (
                                sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[var(--ee-brand)]" /> : <ArrowDown className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {renderActions && (
                    <th className="w-16 px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ee-border-subtle)] text-[var(--ee-text)]">
                {sortedRows.map((row, idx) => {
                  const rowKey = String((row as any).name || (row as any).id || idx);
                  const isRowSelected = Boolean(selected[rowKey]);

                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick?.(row)}
                      className={clsx(
                        "transition-colors",
                        isRowSelected ? "bg-[var(--ee-surface-inset)]" : "hover:bg-[var(--ee-surface-inset)]",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {selectable && (
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isRowSelected}
                            onCheckedChange={() => toggleRow(rowKey)}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={clsx(
                            "px-4 py-3 text-sm",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center"
                          )}
                        >
                          {col.render
                            ? col.render(row[col.key as keyof T], row)
                            : String(row[col.key as keyof T] ?? "")}
                        </td>
                      ))}
                      {renderActions && (
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderActions(row)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
