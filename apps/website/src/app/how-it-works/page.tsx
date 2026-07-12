import { config } from "@thrift/config";
import { Card, Button } from "@thrift/ui";

const steps = [
  { step: "01", title: "Create or Join a Circle", description: "Start a thrift group with people you trust, or join an existing circle in your community. Set your contribution amount and cycle frequency.", details: ["Flexible contribution amounts", "Daily, weekly, or monthly cycles", "Invite members by link or code"] },
  { step: "02", title: "Contribute Each Cycle", description: "Pay your fixed amount every cycle. Contributions are held securely and tracked transparently for all members to see.", details: ["Secure escrow protection", "Real-time contribution tracking", "Automated payment reminders"] },
  { step: "03", title: "Collect Your Pot", description: "When your turn comes, receive the full collected amount from all members. Build your savings systematically over time.", details: ["Guaranteed payout schedule", "Trust score builds with each cycle", "No delays or manual coordination"] },
];

const faqs = [
  { q: "What is Arosco?", a: "Arosco (also called Ajo) is a traditional Nigerian communal thrift savings system. Members contribute a fixed amount each cycle and take turns receiving the total pot. It's built on trust and community." },
  { q: "How is my money protected?", a: "Contributions are held in a secure escrow until payout time. Funds are released only to the designated recipient when the cycle closes." },
  { q: "What if a member doesn't pay?", a: "Members with missed payments receive automatic reminders. Their trust score is affected, and circle leaders can set policies for handling defaults." },
  { q: "Can I join multiple circles?", a: "Yes. You can be a member of as many circles as you can manage. Your dashboard tracks all your active circles and contribution schedules." },
];

export default function HowItWorks() {
  return (
    <>
      <main style={{ flex: 1 }}>
        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderBottom: `1px solid ${config.colors.primary}10`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <span style={{ color: config.colors.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "10px", fontWeight: 700 }}>Simple Process</span>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 300, color: "#1A1A1A", marginTop: "0.5rem", letterSpacing: "-0.025em" }}>
              How <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>Arosco</span> works
            </h1>
            <p style={{ fontSize: "14px", color: "#666", fontWeight: 300, marginTop: "0.75rem", lineHeight: 1.7 }}>
              Three simple steps to start saving with your community.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {steps.map((s, i) => (
              <Card key={s.step} padding="2rem" style={{ borderTop: `3px solid ${config.colors.primary}${["20", "35", "50"][i]}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <span style={{ fontSize: "2.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, opacity: 0.2 }}>{s.step}</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "0.5rem" }}>{s.title}</h2>
                      <p style={{ fontSize: "13px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>{s.description}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {s.details.map((d, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "#2D2D2D" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: `${config.colors.primary}15`, color: config.colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>&#10003;</div>
                        <span>{d}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderTop: `1px solid ${config.colors.primary}10`, padding: "3rem 2rem" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "1.5rem" }}>Frequently Asked Questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {faqs.map((faq, i) => (
                <Card key={i} padding="1.25rem">
                  <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.375rem" }}>{faq.q}</h3>
                  <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 300, color: "#1A1A1A", marginBottom: "0.75rem" }}>Ready to start saving?</h2>
          <p style={{ fontSize: "13px", color: "#717171", fontWeight: 300, marginBottom: "1.5rem" }}>Create a free circle or join an existing one today.</p>
          <Button size="lg">Get Started Free</Button>
        </div>
      </main>
    </>
  );
}
