import { clsx } from "@/lib/clsx";

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary",
        className
      )}
    >
      {children}
    </span>
  );
}
