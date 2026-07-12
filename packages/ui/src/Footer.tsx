import { config } from "@thrift/config";

interface FooterProps {
  links?: { label: string; href: string }[];
}

export function Footer({ links = [] }: FooterProps) {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 2rem",
        background: `linear-gradient(135deg, ${config.colors.secondary} 0%, ${config.colors.primary} 100%)`,
        color: "rgba(255,255,255,0.7)",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <div>&copy; {new Date().getFullYear()} {config.name.toUpperCase()}</div>
      <div style={{ display: "flex", gap: "2rem" }}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.2s" }}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#4ADE80",
            display: "inline-block",
            boxShadow: "0 0 6px rgba(74,222,128,0.5)",
          }}
        />
        <span style={{ fontSize: "9px", letterSpacing: "0.15em" }}>System Active</span>
      </div>
    </footer>
  );
}
