import Link from "next/link";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "accent" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30",
  accent:
    "bg-brand-accent text-white hover:bg-brand-gold shadow-lg shadow-brand-accent/20 hover:shadow-xl",
  outline:
    "bg-white text-brand-primary border-2 border-brand-primary/40 hover:border-brand-primary hover:bg-brand-primary hover:text-white shadow-sm",
  ghost: "bg-transparent text-brand-primary hover:bg-brand-primary/8",
  dark: "bg-brand-dark text-white hover:bg-black/90 shadow-lg shadow-brand-dark/20",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-sm px-7 py-3.5",
};

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled,
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
