import { clsx } from "@/lib/clsx";

export function Logo({
  className = "",
  showWordmark = true,
  wordmarkClassName = "",
}: {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 100 100" className="h-8 w-8">
        <defs>
          <linearGradient id="aroscoWave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3D7A52" />
            <stop offset="55%" stopColor="#2D5A3D" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
        <path
          d="M10 50 C 30 10, 40 90, 60 50 C 80 10, 70 90, 90 50"
          fill="none"
          stroke="url(#aroscoWave)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span
          className={clsx(
            "font-display text-xl font-bold tracking-tight text-brand-dark",
            wordmarkClassName
          )}
        >
          Arosco
        </span>
      )}
    </span>
  );
}
