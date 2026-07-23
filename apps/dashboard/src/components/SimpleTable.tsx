"use client";

import { ReactNode } from "react";

export interface SimpleColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  mono?: boolean;
  width?: string;
  render: (item: T, index: number) => ReactNode;
}

interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  minWidth?: string;
  emptyMessage?: string;
}

export function SimpleTable<T>({
  columns,
  data,
  onRowClick,
  minWidth,
  emptyMessage = "No data found.",
}: SimpleTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center p-12 text-slate-400 text-[13px]">
        {emptyMessage}
      </div>
    );
  }

  return (
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
  );
}
