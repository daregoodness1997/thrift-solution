"use client";

import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  mono?: boolean;
  width?: string;
  render: (item: T, index: number) => ReactNode;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  accentColor?: string;
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  data,
  pagination,
  onPageChange,
  onRowClick,
  loading = false,
  emptyMessage = "No data found.",
  emptyAction,
  accentColor = "#4A5D4E",
  minWidth,
}: DataTableProps<T>) {
  const { page, total, totalPages } = pagination;

  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = total === 0 ? 0 : (page - 1) * pagination.limit + 1;
  const endItem = Math.min(page * pagination.limit, total);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "13px" }}>
        {emptyMessage}
        {emptyAction && <div style={{ marginTop: "0.75rem" }}>{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", ...(minWidth ? { minWidth } : {}) }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F0F0F0", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "1rem 1.5rem",
                    textAlign: col.align || "left",
                    fontWeight: 600,
                    ...(col.width ? { width: col.width } : {}),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #F5F5F5",
                  transition: "background 0.15s",
                  cursor: onRowClick ? "pointer" : "default",
                }}
                onClick={() => onRowClick?.(item)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "0.875rem 1.5rem",
                      textAlign: col.align || "left",
                      ...(col.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}),
                    }}
                  >
                    {col.render(item, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderTop: "1px solid #F0F0F0", gap: "0.75rem" }}>
          <span style={{ fontSize: "11px", color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>
            Showing {startItem}–{endItem} of {total}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              style={{
                padding: "0.375rem 0.625rem",
                borderRadius: "0.375rem",
                fontSize: "11px",
                fontWeight: 600,
                cursor: page <= 1 ? "not-allowed" : "pointer",
                border: "1px solid #EAEAEA",
                backgroundColor: "#ffffff",
                color: page <= 1 ? "#D1D5DB" : "#717171",
                transition: "all 0.15s",
              }}
            >
              Prev
            </button>
            {getVisiblePages().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} style={{ padding: "0.375rem 0.375rem", fontSize: "11px", color: "#D1D5DB" }}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  style={{
                    padding: "0.375rem 0.625rem",
                    borderRadius: "0.375rem",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${p === page ? accentColor : "#EAEAEA"}`,
                    backgroundColor: p === page ? accentColor : "#ffffff",
                    color: p === page ? "#ffffff" : "#717171",
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: "0.375rem 0.625rem",
                borderRadius: "0.375rem",
                fontSize: "11px",
                fontWeight: 600,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                border: "1px solid #EAEAEA",
                backgroundColor: "#ffffff",
                color: page >= totalPages ? "#D1D5DB" : "#717171",
                transition: "all 0.15s",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
