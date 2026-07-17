"use client";

import { Button } from "@thrift/ui";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row p-4">
      <p className="text-[12px] text-gray-500">
        Showing <span className="font-semibold text-brand-dark">{start}</span>–
        <span className="font-semibold text-brand-dark">{end}</span> of{" "}
        <span className="font-semibold text-brand-dark">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
          className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-600 transition-all duration-150 hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1.5 text-[13px] text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                disabled={loading}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-lg px-2.5 text-[12px] font-semibold transition-all duration-150 ${
                  p === page
                    ? "bg-brand-primary text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
          className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-600 transition-all duration-150 hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
