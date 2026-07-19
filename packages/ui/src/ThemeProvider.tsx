import { config } from "@thrift/config";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        "--color-primary": config.colors.primary,
        "--color-secondary": config.colors.secondary,
        "--color-accent": config.colors.accent,
        "--color-background": config.colors.background,
        "--color-surface": config.colors.surface,
        "--color-text": config.colors.text,
        "--color-text-muted": config.colors.textMuted,
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${config.colors.background} 0%, #EAF1FB 50%, ${config.colors.background} 100%)`,
        color: config.colors.text,
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        lineHeight: 1.6,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
