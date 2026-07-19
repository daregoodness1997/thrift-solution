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
  accentColor = "#1D4ED8",
  minWidth,
}: DataTableProps<T>) {
  const { page, total, totalPages } = pagination;

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
