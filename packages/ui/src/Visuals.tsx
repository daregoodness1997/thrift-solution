export function GradientStrip({ colors, height = 4 }: { colors: string[]; height?: number }) {
  return (
    <div
      style={{
        height: `${height}px`,
        background: `linear-gradient(90deg, ${colors.join(", ")})`,
        width: "100%",
      }}
    />
  );
}

export function HeroIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="300" cy="200" r="160" fill="#2D5A3D" fillOpacity="0.08" />
      <circle cx="300" cy="200" r="120" fill="#2D5A3D" fillOpacity="0.05" />
      <circle cx="300" cy="200" r="80" fill="#B8860B" fillOpacity="0.04" />

      {/* Coins / Savings */}
      <ellipse cx="300" cy="260" rx="60" ry="18" fill="#2D5A3D" fillOpacity="0.14" />
      <rect x="260" y="200" width="80" height="60" rx="8" fill="#2D5A3D" fillOpacity="0.18" />
      <rect x="268" y="208" width="64" height="44" rx="4" fill="white" fillOpacity="0.85" />
      <text x="300" y="236" textAnchor="middle" fontSize="18" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill="#2D5A3D">₦</text>

      {/* Floating coins */}
      <circle cx="200" cy="160" r="20" fill="#B8860B" fillOpacity="0.25" />
      <circle cx="200" cy="160" r="14" fill="white" fillOpacity="0.7" />
      <text x="200" y="165" textAnchor="middle" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill="#B8860B">₦</text>

      <circle cx="400" cy="140" r="16" fill="#2D5A3D" fillOpacity="0.3" />
      <circle cx="400" cy="140" r="11" fill="white" fillOpacity="0.7" />
      <text x="400" y="144" textAnchor="middle" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill="#2D5A3D">₦</text>

      <circle cx="350" cy="100" r="12" fill="#B8860B" fillOpacity="0.2" />
      <circle cx="350" cy="100" r="8" fill="white" fillOpacity="0.6" />

      {/* People silhouettes (circle members) */}
      <circle cx="180" cy="280" r="18" fill="#2D5A3D" fillOpacity="0.25" />
      <circle cx="180" cy="272" r="8" fill="#2D5A3D" fillOpacity="0.3" />
      <path d="M168 292c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#2D5A3D" fillOpacity="0.25" />

      <circle cx="420" cy="280" r="18" fill="#B8860B" fillOpacity="0.2" />
      <circle cx="420" cy="272" r="8" fill="#B8860B" fillOpacity="0.25" />
      <path d="M408 292c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#B8860B" fillOpacity="0.2" />

      <circle cx="300" cy="320" r="16" fill="#2D5A3D" fillOpacity="0.2" />
      <circle cx="300" cy="313" r="7" fill="#2D5A3D" fillOpacity="0.25" />
      <path d="M290 330c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="#2D5A3D" fillOpacity="0.2" />

      {/* Connection lines */}
      <line x1="198" y1="280" x2="282" y2="320" stroke="#2D5A3D" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="402" y1="280" x2="318" y2="320" stroke="#2D5A3D" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="198" y1="275" x2="282" y2="230" stroke="#B8860B" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Decorative dots */}
      <circle cx="120" cy="120" r="3" fill="#2D5A3D" fillOpacity="0.2" />
      <circle cx="480" cy="100" r="3" fill="#B8860B" fillOpacity="0.2" />
      <circle cx="100" cy="300" r="2" fill="#2D5A3D" fillOpacity="0.15" />
      <circle cx="500" cy="320" r="2" fill="#B8860B" fillOpacity="0.15" />
    </svg>
  );
}

export function CircleIllustration() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="100" cy="100" r="80" stroke="#2D5A3D" strokeOpacity="0.15" strokeWidth="2" fill="none" />
      <circle cx="100" cy="100" r="60" stroke="#2D5A3D" strokeOpacity="0.1" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="100" r="40" stroke="#B8860B" strokeOpacity="0.12" strokeWidth="1" fill="none" />

      {/* Member dots on the ring */}
      <circle cx="100" cy="20" r="8" fill="#2D5A3D" fillOpacity="0.3" />
      <circle cx="170" cy="65" r="7" fill="#B8860B" fillOpacity="0.25" />
      <circle cx="155" cy="150" r="8" fill="#2D5A3D" fillOpacity="0.25" />
      <circle cx="45" cy="150" r="7" fill="#B8860B" fillOpacity="0.3" />
      <circle cx="30" cy="65" r="8" fill="#2D5A3D" fillOpacity="0.2" />

      {/* Center */}
      <circle cx="100" cy="100" r="16" fill="#2D5A3D" fillOpacity="0.15" />
      <text x="100" y="105" textAnchor="middle" fontSize="12" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fill="#2D5A3D" fillOpacity="0.7">₦</text>
    </svg>
  );
}

export function SavingsGrowthChart() {
  return (
    <svg width="100%" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Grid lines */}
      <line x1="0" y1="30" x2="300" y2="30" stroke="#E0DCD4" strokeWidth="0.5" />
      <line x1="0" y1="60" x2="300" y2="60" stroke="#E0DCD4" strokeWidth="0.5" />
      <line x1="0" y1="90" x2="300" y2="90" stroke="#E0DCD4" strokeWidth="0.5" />

      {/* Growth area */}
      <path d="M0 100 L50 85 L100 70 L150 55 L200 35 L250 20 L300 10 L300 110 L0 110 Z" fill="url(#savingsGradient2)" />
      <defs>
        <linearGradient id="savingsGradient2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D5A3D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2D5A3D" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Growth line */}
      <path d="M0 100 L50 85 L100 70 L150 55 L200 35 L250 20 L300 10" stroke="#2D5A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      <circle cx="50" cy="85" r="3" fill="white" stroke="#2D5A3D" strokeWidth="1.5" />
      <circle cx="100" cy="70" r="3" fill="white" stroke="#2D5A3D" strokeWidth="1.5" />
      <circle cx="150" cy="55" r="3" fill="white" stroke="#2D5A3D" strokeWidth="1.5" />
      <circle cx="200" cy="35" r="3" fill="white" stroke="#2D5A3D" strokeWidth="1.5" />
      <circle cx="250" cy="20" r="3" fill="white" stroke="#2D5A3D" strokeWidth="1.5" />
      <circle cx="300" cy="10" r="4" fill="#2D5A3D" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function ColorfulBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: color,
        backgroundColor: `${color}12`,
        border: `1px solid ${color}20`,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color }} />
      {label}
    </div>
  );
}

export function DecorativeDots({ color = "#4A5D4E" }: { color?: string }) {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="5" cy="5" r="2" fill={color} fillOpacity="0.15" />
      <circle cx="20" cy="5" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="35" cy="5" r="2" fill={color} fillOpacity="0.09" />
      <circle cx="50" cy="5" r="2" fill={color} fillOpacity="0.06" />
      <circle cx="5" cy="20" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="20" cy="20" r="2" fill={color} fillOpacity="0.15" />
      <circle cx="35" cy="20" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="50" cy="20" r="2" fill={color} fillOpacity="0.09" />
      <circle cx="5" cy="35" r="2" fill={color} fillOpacity="0.09" />
      <circle cx="20" cy="35" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="35" cy="35" r="2" fill={color} fillOpacity="0.15" />
      <circle cx="50" cy="35" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="5" cy="50" r="2" fill={color} fillOpacity="0.06" />
      <circle cx="20" cy="50" r="2" fill={color} fillOpacity="0.09" />
      <circle cx="35" cy="50" r="2" fill={color} fillOpacity="0.12" />
      <circle cx="50" cy="50" r="2" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

export function WavySeparator({ color = "#4A5D4E" }: { color?: string }) {
  return (
    <svg width="100%" height="40" viewBox="0 0 1200 40" preserveAspectRatio="none" fill="none">
      <path d="M0 20 Q150 0 300 20 Q450 40 600 20 Q750 0 900 20 Q1050 40 1200 20 L1200 40 L0 40 Z" fill={color} fillOpacity="0.04" />
    </svg>
  );
}

export function ColorBar() {
  return (
    <div style={{ display: "flex", height: "3px", width: "100%" }}>
      <div style={{ flex: 1, background: "linear-gradient(90deg, #2D5A3D, #3D7A52)" }} />
      <div style={{ flex: 1, background: "linear-gradient(90deg, #B8860B, #D4A017)" }} />
      <div style={{ flex: 1, background: "linear-gradient(90deg, #1E3D2A, #2D5A3D)" }} />
      <div style={{ flex: 1, background: "linear-gradient(90deg, #8B6914, #B8860B)" }} />
      <div style={{ flex: 1, background: "linear-gradient(90deg, #3D7A52, #4A8D63)" }} />
    </div>
  );
}
