import { config } from "@thrift/config";
import { Card } from "@thrift/ui";
import { formatNaira } from "@thrift/utils";

const plans = [
  {
    name: "Starter Circle",
    tagline: "For small thrift groups",
    price: 0,
    members: "Up to 5 members",
    perks: ["Basic contribution tracking", "Automated reminders", "Up to 2 active circles", "Member trust scores"],
    description: "Perfect for family or small friend groups starting their Ajo journey.",
  },
  {
    name: "Community Circle",
    tagline: "For growing thrift groups",
    price: 2500,
    members: "Up to 20 members",
    perks: ["Unlimited active circles", "Secure escrow protection", "Advanced analytics", "Priority support", "Custom contribution schedules"],
    description: "For active communities and market groups managing multiple thrift circles.",
    popular: true,
  },
  {
    name: "Enterprise Circle",
    tagline: "For organizations",
    price: 10000,
    members: "Unlimited members",
    perks: ["Everything in Community", "Admin dashboard", "API access", "Dedicated support", "Custom branding", "Compliance reporting"],
    description: "For cooperatives, microfinance institutions, and organizational savings programs.",
  },
];

export default function Pricing() {
  return (
    <>
      <main style={{ flex: 1 }}>
        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderBottom: `1px solid ${config.colors.primary}10`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <span style={{ color: config.colors.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "10px", fontWeight: 700 }}>Plans & Pricing</span>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 300, color: "#1A1A1A", marginTop: "0.5rem", letterSpacing: "-0.025em" }}>
              Choose your <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>circle plan</span>
            </h1>
            <p style={{ fontSize: "14px", color: "#666", fontWeight: 300, marginTop: "0.75rem", lineHeight: 1.7 }}>
              Start free. Upgrade as your thrift circles grow.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  border: plan.popular ? `2px solid ${config.colors.primary}` : "1px solid #EAEAEA",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: "1rem", right: "1rem", backgroundColor: config.colors.primary, color: "#fff", fontSize: "9px", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Most Popular</div>
                )}
                <div style={{ marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, backgroundColor: `${config.colors.primary}0A`, border: `1px solid ${config.colors.primary}15`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{plan.members}</span>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1A1A1A", marginTop: "0.75rem" }}>{plan.name}</h3>
                  <p style={{ fontSize: "11px", color: "#5A5A5A", fontStyle: "italic", fontWeight: 300, marginTop: "0.25rem" }}>{plan.tagline}</p>
                </div>
                <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7, marginBottom: "1.5rem" }}>{plan.description}</p>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A7A7A", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>Included</span>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {plan.perks.map((perk, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "#2D2D2D", fontWeight: 300 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: config.colors.primary, flexShrink: 0 }} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A7A7A", display: "block" }}>Monthly</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1A1A1A", fontFamily: "'JetBrains Mono', monospace" }}>
                      {plan.price === 0 ? "Free" : `${formatNaira(plan.price)}/mo`}
                    </span>
                  </div>
                  <button style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: plan.popular ? config.colors.primary : "transparent", color: plan.popular ? "#ffffff" : config.colors.primary, border: plan.popular ? "none" : `1.5px solid ${config.colors.primary}`, transition: "all 0.25s ease" }}>Get Started</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${config.colors.primary}0A 0%, ${config.colors.surface} 50%, ${config.colors.accent}08 100%)`, borderTop: `1px solid ${config.colors.primary}10`, padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#1A1A1A", marginBottom: "1.5rem" }}>Plan Questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
                { q: "Is my money safe?", a: "All contributions are held in secure escrow until payout time. Funds are protected until the cycle closes and the designated recipient collects." },
                { q: "What happens if a member defaults?", a: "Members with missed payments receive automatic reminders. Their trust score is affected, and circle leaders can enforce contribution policies." },
              ].map((faq, i) => (
                <Card key={i} padding="1.25rem">
                  <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.375rem" }}>{faq.q}</h3>
                  <p style={{ fontSize: "12px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
