"use client";

export function Skeleton({ width, height = "1em", style, className = "", ...props }: { width?: string | number; height?: string | number; style?: React.CSSProperties; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex-shrink-0 animate-pulse rounded-md bg-gray-200 ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, gap = "0.5rem", style }: { lines?: number; gap?: string; style?: React.CSSProperties }) {
  return (
    <div className="flex flex-col" style={{ gap, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height="10px" />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="flex-shrink-0 animate-pulse rounded-full bg-gray-200"
      style={{ width: size, height: size, ...style }}
    />
  );
}

export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6"
      style={style}
    >
      <Skeleton width="40%" height="12px" />
      <Skeleton width="70%" height="24px" />
      <Skeleton width="50%" height="10px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style }: { rows?: number; cols?: number; style?: React.CSSProperties }) {
  return (
    <div className="w-full" style={style}>
      <div className="flex gap-4 border-b border-gray-100 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? "25%" : i === cols - 1 ? "15%" : "20%"} height="8px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-50 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? "25%" : c === cols - 1 ? "15%" : "20%"} height="10px" />
          ))}
        </div>
      ))}
    </div>
  );
}
