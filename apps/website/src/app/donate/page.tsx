"use client";

import { useState } from "react";
import { config } from "@thrift/config";
import { Button, Card, ColorfulBadge, FadeIn, FadeInUp, ScaleIn, StaggerChildren } from "@thrift/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

const impactItems = [
  { amount: "\u20A65,000", impact: "Provides school supplies for one child for a term", icon: "\uD83D\uDCDA" },
  { amount: "\u20A610,000", impact: "Funds a week of meals for a family in need", icon: "\uD83C\uDF5D" },
  { amount: "\u20A625,000", impact: "Covers medical checkups for two people", icon: "\uD83C\uDFE5" },
  { amount: "\u20A650,000", impact: "Provides clean water access for a household for a month", icon: "\uD83D\uDCA7" },
];

const testimonials = [
  { name: "Chidi O.", text: "Donating through Arosco was seamless. I could choose exactly where my money goes and track the impact in real time.", color: "#4A5D4E" },
  { name: "Blessing E.", text: "I love that I can donate items directly. The process is simple and I get confirmation right away.", color: "#8A7D73" },
  { name: "Ibrahim K.", text: "The multiple payment options make it so convenient. I use Paystack and it processes instantly.", color: "#3D4D40" },
];

export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [provider, setProvider] = useState("paystack");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDonate = async () => {
    const selectedAmount = customAmount || amount;
    if (!selectedAmount || parseFloat(selectedAmount) <= 0) {
      setError("Please select or enter an amount");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/donations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: parseFloat(selectedAmount),
          provider,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to initiate donation");
        return;
      }

      if (data.data.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 2rem" }}>
        <FadeIn>
          <Card padding="3rem" style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{config.colors.primary}✓</div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.75rem" }}>Thank You!</h2>
            <p style={{ fontSize: "14px", color: "#717171", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Your donation has been recorded. You&apos;ll receive a confirmation email shortly.
            </p>
            <Button onClick={() => setSuccess(false)}>Donate Again</Button>
          </Card>
        </FadeIn>
      </main>
    );
  }

  return (
    <>
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ position: "relative", overflow: "hidden", padding: "4rem 2rem 3rem" }}>
          <div style={{ position: "absolute", top: "-8rem", right: "-8rem", width: "30rem", height: "30rem", background: `radial-gradient(circle, ${config.colors.primary}10 0%, transparent 70%)`, borderRadius: "50%" }} />

          <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
            <FadeInUp delay={100}>
              <ColorfulBadge label="Support Our Community" color={config.colors.primary} />
            </FadeInUp>

            <FadeInUp delay={200}>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1A1A1A", marginTop: "1rem", marginBottom: "0.75rem" }}>
                Make a{" "}
                <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>donation</span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={300}>
              <p style={{ fontSize: "15px", color: "#666", fontWeight: 300, lineHeight: 1.7, maxWidth: "520px" }}>
                Your generosity helps families build financial security through communal savings. Every contribution makes a difference.
              </p>
            </FadeInUp>
          </div>
        </section>

        {/* Impact Stats */}
        <section style={{ padding: "0 2rem 3rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {impactItems.map((item) => (
                <ScaleIn key={item.amount} delay={200}>
                  <Card padding="1.5rem">
                    <div style={{ display: "block", marginBottom: "0.5rem", color: config.colors.primary }}>{item.icon}</div>
                    <span style={{ fontSize: "1.25rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: config.colors.primary, display: "block", marginBottom: "0.25rem" }}>{item.amount}</span>
                    <span style={{ fontSize: "12px", color: "#717171", fontWeight: 300, lineHeight: 1.6 }}>{item.impact}</span>
                  </Card>
                </ScaleIn>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* Donation Form */}
        <section style={{ padding: "2rem 2rem 4rem", backgroundColor: "#F5F7F5", borderTop: "1px solid #E1E8E1" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <FadeInUp>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <ColorfulBadge label="Donate Now" color={config.colors.primary} />
                <h2 style={{ fontSize: "1.5rem", fontWeight: 300, color: "#1A1A1A", marginTop: "0.75rem" }}>
                  Choose your contribution
                </h2>
              </div>
            </FadeInUp>

            <FadeInUp delay={200}>
              <Card padding="2rem">
                {error && (
                  <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "13px", marginBottom: "1rem" }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>Select Amount</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => { setAmount(String(preset)); setCustomAmount(""); }}
                        style={{
                          padding: "0.75rem",
                          borderRadius: "0.75rem",
                          border: `1px solid ${amount === String(preset) ? config.colors.primary : "#EAEAEA"}`,
                          backgroundColor: amount === String(preset) ? `${config.colors.primary}0A` : "#ffffff",
                          color: amount === String(preset) ? config.colors.primary : "#717171",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        ₦{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "#999" }}>₦</span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
                      style={{ width: "100%", padding: "0.75rem 0.75rem 0.75rem 1.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", outline: "none", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>Payment Method</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["paystack", "flutterwave", "nomba"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setProvider(p)}
                        style={{
                          flex: 1,
                          padding: "0.625rem",
                          borderRadius: "0.75rem",
                          border: `1px solid ${provider === p ? config.colors.primary : "#EAEAEA"}`,
                          backgroundColor: provider === p ? `${config.colors.primary}0A` : "#ffffff",
                          color: provider === p ? config.colors.primary : "#717171",
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block", marginBottom: "0.5rem" }}>Notes (optional)</label>
                  <textarea
                    placeholder="Add a message with your donation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #EAEAEA", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s ease", boxSizing: "border-box" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; }}
                  />
                </div>

                <Button
                  onClick={handleDonate}
                  disabled={loading || (!amount && !customAmount) || !email}
                  style={{ width: "100%", justifyContent: "center", opacity: loading || (!amount && !customAmount) || !email ? 0.5 : 1 }}
                >
                  {loading ? "Processing..." : "Donate Now"}
                </Button>

                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #F0F0F0" }}>
                  <span style={{ fontSize: "10px", color: "#999", display: "flex", alignItems: "center", gap: "0.375rem" }}>&#128274; SSL Encrypted</span>
                  <span style={{ fontSize: "10px", color: "#999", display: "flex", alignItems: "center", gap: "0.375rem" }}>&#10003; Secure Payment</span>
                </div>
              </Card>
            </FadeInUp>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "4rem 2rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <FadeInUp>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <ColorfulBadge label="Donor Stories" color={config.colors.accent} />
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.025em", marginTop: "0.75rem" }}>
                  Hear from our <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: config.colors.primary, fontWeight: 500 }}>donors</span>
                </h2>
              </div>
            </FadeInUp>

            <StaggerChildren staggerDelay={150} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {testimonials.map((t) => (
                <Card key={t.name} padding="1.5rem">
                  <p style={{ fontSize: "13px", color: "#2D2D2D", fontWeight: 300, lineHeight: 1.7, marginBottom: "1.25rem", fontStyle: "italic" }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: t.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>{t.name.charAt(0)}</div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D" }}>{t.name}</span>
                  </div>
                </Card>
              ))}
            </StaggerChildren>
          </div>
        </section>
      </main>
    </>
  );
}
