import { clsx } from "@/lib/clsx";
export { Badge } from "./Badge";

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-7xl px-6", className)}>{children}</div>
  );
}

export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-brand-primary via-brand-sage to-brand-accent bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-brand-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base font-light leading-relaxed text-brand-muted">
          {description}
        </p>
      )}
    </div>
  );
}
