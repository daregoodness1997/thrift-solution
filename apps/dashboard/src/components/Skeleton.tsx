"use client";

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease-in-out infinite",
  borderRadius: "0.375rem",
};

export function Skeleton({ width, height = "1em", style, ...props }: { width?: string | number; height?: string | number; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ ...shimmerStyle, width, height, flexShrink: 0, ...style }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, gap = "0.5rem", style }: { lines?: number; gap?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height="10px" />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "0.75rem",
        border: "1px solid #F0F0F0",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        ...style,
      }}
    >
      <Skeleton width="40%" height="12px" />
      <Skeleton width="70%" height="24px" />
      <Skeleton width="50%" height="10px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style }: { rows?: number; cols?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: "100%", ...style }}>
      <div style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #F0F0F0" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? "25%" : i === cols - 1 ? "15%" : "20%"} height="8px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #F5F5F5" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? "25%" : c === cols - 1 ? "15%" : "20%"} height="10px" />
          ))}
        </div>
      ))}
    </div>
  );
}
