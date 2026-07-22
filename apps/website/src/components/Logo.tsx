import { clsx } from "@/lib/clsx";
import { config } from "@thrift/config";

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
      <img src="/logo.png" alt={config.name} className="h-8 w-8 rounded-md object-contain" />
      {showWordmark && (
        <span
          className={clsx(
            "font-display text-xl font-bold tracking-tight text-brand-dark dark:text-slate-100",
            wordmarkClassName
          )}
        >
          {config.name}
        </span>
      )}
    </span>
  );
}
