import { config } from "@thrift/config";
import { Card, HandshakeIcon, MoneyIcon, BellIcon, ShieldIcon, ChartIcon, MegaphoneIcon } from "@thrift/ui";

const features = [
  { icon: <HandshakeIcon size={24} />, title: "Ajo Circles", desc: "Create or join thrift groups with people you trust. Each circle has a fixed contribution amount and cycle schedule.", highlight: "Flexible group sizes" },
  { icon: <MoneyIcon size={24} />, title: "Contribution Tracking", desc: "Transparent ledgers show every payment in real time. No more chasing people for money.", highlight: "Real-time updates" },
  { icon: <BellIcon size={24} />, title: "Smart Reminders", desc: "Automated alerts before contribution deadlines. Members never miss a payment.", highlight: "Never miss a cycle" },
  { icon: <ShieldIcon size={24} />, title: "Secure Escrow", desc: "Funds are held safely until payout time. Both the circle and individual members are protected.", highlight: "Protected funds" },
  { icon: <ChartIcon size={24} />, title: "Trust Scoring", desc: "Build your reputation through consistent contributions. Higher trust scores unlock larger circles.", highlight: "Build credibility" },
  { icon: <MegaphoneIcon size={24} />, title: "Payout Notifications", desc: "Get notified when it's your turn to collect, when contributions are due, and circle milestones.", highlight: "Stay informed" },
];

const circles = [
  { name: "Family Circle", desc: "Save together with relatives for school fees, holidays, and family projects." },
  { name: "Market Women Circle", desc: "Traders pooling resources to restock inventory and expand their businesses." },
  { name: "Office Colleagues", desc: "Coworkers building an emergency fund through structured weekly contributions." },
  { name: "Community Development", desc: "Neighborhood groups saving for local infrastructure and community events." },
];

export default function Marketplace() {
  return (
    <>
      <main style={{ flex: 1 }}>
        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderBottom: `1px solid ${config.colors.primary}10`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <span style={{ color: config.colors.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "10px", fontWeight: 700 }}>Platform Features</span>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 300, color: "#1A1A1A", marginTop: "0.5rem", letterSpacing: "-0.025em" }}>
              Built for <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>communal thrift</span>
            </h1>
            <p style={{ fontSize: "14px", color: "#666", fontWeight: 300, marginTop: "0.75rem", lineHeight: 1.7, maxWidth: "520px", margin: "0.75rem auto 0" }}>
              Everything you need to manage Ajo circles — from contribution tracking to secure payouts.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {features.map((f) => (
              <Card key={f.title} padding="1.5rem">
                <div style={{ display: "block", marginBottom: "0.75rem", color: config.colors.primary }}>{f.icon}</div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.375rem" }}>{f.title}</h3>
                <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7, marginBottom: "0.75rem" }}>{f.desc}</p>
                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: config.colors.primary, backgroundColor: `${config.colors.primary}0A`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{f.highlight}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Circle Types */}
        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderTop: `1px solid ${config.colors.primary}10`, borderBottom: `1px solid ${config.colors.primary}10`, padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A" }}>Popular Circle Types</h2>
              <p style={{ fontSize: "12px", color: "#7A7A7A", fontWeight: 300 }}>Communities already saving together on Arosco.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {circles.map((c, i) => (
                <div key={c.name} style={{ background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1rem", padding: "1.5rem", borderTop: `3px solid ${config.colors.primary}${["15", "25", "35", "45"][i]}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.375rem" }}>{c.name}</h4>
                  <p style={{ fontSize: "11px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
