"use client";

import { ReactNode } from "react";
import Pagination from "@/components/Pagination";

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
  minWidth,
}: DataTableProps<T>) {
  const { page, total, totalPages } = pagination;

  if (loading) {
    return (
      <div className="text-center p-12 text-slate-400 text-[13px]">
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-12 text-slate-400 text-[13px]">
        {emptyMessage}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse" style={minWidth ? { minWidth } : undefined}>
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-semibold"
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
                className="border-b border-slate-100 dark:border-slate-800/50 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                style={{ cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.mono ? "font-mono" : ""}`}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={pagination.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}
