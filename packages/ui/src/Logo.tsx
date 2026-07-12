import { config } from "@thrift/config";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <img
        src={config.logo}
        alt={`${config.name} logo`}
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
