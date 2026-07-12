import { config } from "@thrift/config";
import { Card, StatCard } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";

const values = [
  { name: "Trust First", desc: "Built on the centuries-old Ajo tradition. Every feature reinforces accountability and reliability among circle members." },
  { name: "Transparent Savings", desc: "Real-time contribution tracking and visible ledgers. Every member sees exactly where the money goes." },
  { name: "Community Prosperity", desc: "Our mission is to make communal thrift accessible, secure, and scalable for every community." },
];

const milestones = [
  { year: "2025", event: "Launched with 5 pilot circles in Lagos" },
  { year: "2025", event: `First ${formatNaira(1000000)} saved by community members` },
  { year: "2026", event: "Expanded to 8 states across Nigeria" },
  { year: "2026", event: "1,200+ active members saving together" },
];

export default function About() {
  return (
    <>
      <main style={{ flex: 1 }}>
        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderBottom: `1px solid ${config.colors.primary}10`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <span style={{ color: config.colors.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "10px", fontWeight: 700 }}>Our Story</span>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 300, color: "#1A1A1A", marginTop: "0.5rem", letterSpacing: "-0.025em" }}>
              Modernizing <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>Ajo</span>, one circle at a time.
            </h1>
            <p style={{ fontSize: "14px", color: "#666", fontWeight: 300, marginTop: "0.75rem", lineHeight: 1.7, maxWidth: "600px", margin: "0.75rem auto 0" }}>
              {config.name} is a digital platform for traditional communal thrift savings. We bring the trust and discipline of Ajo into the modern era with transparent tracking, secure escrow, and smart automation.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
            <StatCard label="Total Saved" value="₦4.2M" change="by our community" positive variant="default" />
            <StatCard label="Active Members" value="1,200+" change="across 8 states" positive variant="warm" />
            <StatCard label="Completed Circles" value="340" change="and counting" positive variant="default" />
          </div>

          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "1.5rem" }}>Our Values</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
              {values.map((v, i) => (
                <Card key={i} padding="1.5rem" style={{ borderTop: `3px solid ${config.colors.primary}${["20", "35", "50"][i]}` }}>
                  <span style={{ fontSize: "2rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, opacity: 0.2 }}>0{i + 1}</span>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginTop: "0.5rem", marginBottom: "0.375rem" }}>{v.name}</h3>
                  <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>{v.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Mission */}
          <Card padding="3rem" variant="surface">
            <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
              <span style={{ color: config.colors.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "10px", fontWeight: 700, display: "block", marginBottom: "0.75rem" }}>Our Mission</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 300, color: "#1A1A1A", lineHeight: 1.4, marginBottom: "1rem" }}>
                We believe that <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>every community deserves a secure way to save together</span>, and every individual deserves the discipline of a structured thrift system.
              </h2>
              <p style={{ fontSize: "13px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>
                {config.name} makes it easy to create, manage, and participate in Ajo circles &mdash; with the transparency and security that the modern era demands.
              </p>
            </div>
          </Card>

          {/* Milestones */}
          <div style={{ marginTop: "3rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "1.5rem" }}>Milestones</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", backgroundColor: `${config.colors.primary}08`, borderRadius: "0.75rem", border: `1px solid ${config.colors.primary}10` }}>
                  <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, flexShrink: 0 }}>{m.year}</span>
                  <span style={{ fontSize: "12px", color: "#2D2D2D" }}>{m.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={{ marginTop: "3rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.5rem" }}>Get In Touch</h2>
            <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, marginBottom: "1rem" }}>Have questions? We'd love to hear from you.</p>
            <a href={`mailto:${config.contact.email}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.5rem", borderRadius: "9999px", backgroundColor: config.colors.primary, color: "#ffffff", fontSize: "12px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", transition: "all 0.25s ease" }}>{config.contact.email}</a>
          </div>
        </div>
      </main>
    </>
  );
}
