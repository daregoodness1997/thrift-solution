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
      <div className="text-center p-12 text-gray-400 text-[13px]">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-12 text-gray-400 text-[13px]">
        {emptyMessage}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={minWidth ? { minWidth } : undefined}>
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-[0.1em] text-[9px] font-mono">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 font-semibold"
                  style={{ textAlign: col.align || "left", ...(col.width ? { width: col.width } : {}) }}
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
                className="border-b border-[#F5F5F5] transition-colors duration-150 hover:bg-gray-50"
                style={{ cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-3.5 ${col.mono ? "font-mono" : ""}`}
                    style={{ textAlign: col.align || "left" }}
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
        <div className="flex flex-wrap justify-between items-center px-6 py-4 border-t border-gray-100 gap-3">
          <span className="text-[11px] text-gray-400 font-mono">
            Showing {startItem}–{endItem} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-[#EAEAEA] bg-white transition-all duration-150"
              style={{ cursor: page <= 1 ? "not-allowed" : "pointer", color: page <= 1 ? "#D1D5DB" : "#717171" }}
            >
              Prev
            </button>
            {getVisiblePages().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1.5 py-1.5 text-[11px] text-[#D1D5DB]">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all duration-150"
                  style={{
                    border: `1px solid ${p === page ? accentColor : "#EAEAEA"}`,
                    backgroundColor: p === page ? accentColor : "#ffffff",
                    color: p === page ? "#ffffff" : "#717171",
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-[#EAEAEA] bg-white transition-all duration-150"
              style={{ cursor: page >= totalPages ? "not-allowed" : "pointer", color: page >= totalPages ? "#D1D5DB" : "#717171" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
