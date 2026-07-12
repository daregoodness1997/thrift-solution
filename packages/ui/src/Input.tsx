import { config } from "@thrift/config";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      {label && (
        <label
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#999999",
            fontWeight: 700,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          backgroundColor: "#FAFAFA",
          border: `1px solid ${error ? "#ef4444" : "#EAEAEA"}`,
          borderRadius: "0.75rem",
          padding: "0.5rem 0.75rem",
          fontSize: "12px",
          color: "#2D2D2D",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.2s",
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ color: "#ef4444", fontSize: "11px" }}>{error}</span>}
    </div>
  );
}
