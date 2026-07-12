import { config } from "@thrift/config";
import { Button, Card, GradientStrip, HeroIllustration, SavingsGrowthChart, ColorfulBadge, ColorBar, WavySeparator, FadeIn, FadeInUp, ScaleIn, StaggerChildren, HandshakeIcon, MoneyIcon, TrophyIcon, HeartIcon, ChartIcon, ShieldIcon } from "@thrift/ui";

const features = [
  { icon: <HandshakeIcon size={24} />, title: "Ajo Circles", desc: "Join or create contribution groups. Members contribute a fixed amount each cycle and take turns receiving the full pot.", color: "#2D5A3D" },
  { icon: <MoneyIcon size={24} />, title: "Thrift Collections", desc: "Track every contribution in real time. Transparent ledgers so every member sees where the money goes.", color: "#B8860B" },
  { icon: <TrophyIcon size={24} />, title: "Trust Score", desc: "Build your reputation through consistent contributions. A visible trust score backed by your actual payment history.", color: "#8B6914" },
  { icon: <HeartIcon size={24} />, title: "Donations", desc: "Donate funds or items to support your circles and community. Multiple payment providers, instant confirmation.", color: "#DC2626" },
  { icon: <ChartIcon size={24} />, title: "Savings Tracker", desc: "Monitor your total contributions, payouts, and savings growth. See your financial discipline in real numbers.", color: "#1E3D2A" },
  { icon: <ShieldIcon size={24} />, title: "Secure Escrow", desc: "Contributions are held in a secure escrow until payout time. Funds are protected until every member has paid.", color: "#3D7A52" },
];

const stats = [
  { value: "\u20A64.2M", label: "Total Saved", color: "#2D5A3D" },
  { value: "1,200+", label: "Active Members", color: "#B8860B" },
  { value: "340", label: "Completed Circles", color: "#1E3D2A" },
  { value: "98.6%", label: "Payout Rate", color: "#8B6914" },
];

const testimonials = [
  { name: "Adaeze N.", role: "Circle Leader", text: "Arosco helped me organize our church thrift group. Everyone pays on time, and we've completed five full cycles without a single default.", color: "#2D5A3D" },
  { name: "Tunde O.", role: "Member", text: "I used my Ajo payout to fund my small business. Having a structured savings system made all the difference.", color: "#B8860B" },
  { name: "Funke A.", role: "Circle Organizer", text: "Managing contributions used to be a nightmare of spreadsheets. Arosco automates everything \u2014 reminders, tracking, and payouts.", color: "#1E3D2A" },
];

export default function Home() {
  return (
    <>
      <ColorBar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ position: "relative", overflow: "hidden", padding: "5rem 2rem 4rem", background: `linear-gradient(135deg, ${config.colors.primary}08 0%, ${config.colors.background} 40%, ${config.colors.accent}06 100%)` }}>
          <div style={{ position: "absolute", top: "-10rem", right: "-10rem", width: "40rem", height: "40rem", background: `radial-gradient(circle, ${config.colors.primary}18 0%, transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-8rem", left: "-8rem", width: "30rem", height: "30rem", background: `radial-gradient(circle, ${config.colors.accent}15 0%, transparent 70%)`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: "20rem", height: "20rem", background: `radial-gradient(circle, ${config.colors.secondary}08 0%, transparent 70%)`, borderRadius: "50%", transform: "translate(-50%, -50%)" }} />

          <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
            <div>
              <FadeInUp delay={100}>
                <ColorfulBadge label="Communal Thrift Platform" color={config.colors.primary} />
              </FadeInUp>

              <FadeInUp delay={200}>
                <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1A1A1A", marginTop: "1.5rem", marginBottom: "1.25rem" }}>
                  Save together.{" "}
                  <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 500 }}>Grow together.</span>
                </h1>
              </FadeInUp>

              <FadeInUp delay={300}>
                <p style={{ fontSize: "16px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7, maxWidth: "480px", marginBottom: "2rem" }}>
                  A digital Arosco platform for modern thrift circles. Contribute regularly, take turns receiving the pot, and build financial discipline with your community.
                </p>
              </FadeInUp>

              <FadeInUp delay={400}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <Button size="lg">Start a Circle</Button>
                  <Button variant="ghost" size="lg" style={{ color: config.colors.primary }}>
                    See How It Works &rarr;
                  </Button>
                </div>
              </FadeInUp>

              <FadeInUp delay={500}>
                <div style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: `1px solid ${config.colors.primary}15` }}>
                  {stats.map((s, i) => (
                    <div key={s.label} style={{ animationDelay: `${600 + i * 100}ms` }}>
                      <span style={{ fontSize: "1.25rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.color, letterSpacing: "-0.025em", display: "block" }}>{s.value}</span>
                      <span style={{ fontSize: "11px", color: "#7A7A7A", fontWeight: 300 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </FadeInUp>
            </div>

            <FadeIn delay={300} duration={800}>
              <div style={{ position: "relative" }}>
                <HeroIllustration />
              </div>
            </FadeIn>
          </div>
        </section>

        <WavySeparator color={config.colors.primary} />

        {/* Product Visual */}
        <section style={{ padding: "clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 6vw, 4rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <FadeInUp>
              <div style={{ backgroundColor: "#F5F7F5", borderRadius: "1.5rem", padding: "clamp(1rem, 3vw, 2rem)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "20rem", height: "20rem", background: `radial-gradient(circle, ${config.colors.primary}08 0%, transparent 70%)`, borderRadius: "50%" }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", position: "relative" }}>
                  {/* Circle Card */}
                  <ScaleIn delay={200}>
                    <div style={{ background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1rem", padding: "1.5rem", height: "100%", borderTop: `3px solid #22c55e`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                      <ColorfulBadge label="Active Circle" color="#059669" />
                      <div style={{ marginTop: "1rem" }}>
                        <span style={{ fontSize: "2rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1A1A1A", display: "block" }}>₦250,000</span>
                        <span style={{ fontSize: "10px", color: "#7A7A7A", display: "block", marginTop: "0.25rem" }}>Cycle 4 of 8</span>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "#E8E4DC", borderRadius: "9999px", overflow: "hidden", marginTop: "0.75rem" }}>
                        <div style={{ height: "100%", width: "50%", background: `linear-gradient(90deg, ${config.colors.primary}, #22c55e)`, borderRadius: "9999px", transition: "width 1s ease-out" }} />
                      </div>
                       <span style={{ fontSize: "10px", color: "#7A7A7A", display: "block", marginTop: "0.5rem" }}>8 members · ₦25,000/cycle</span>
                    </div>
                  </ScaleIn>

                  {/* Contributions Card */}
                  <ScaleIn delay={350}>
                    <div style={{ background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1rem", padding: "1.5rem", height: "100%", borderTop: `3px solid ${config.colors.accent}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                      <ColorfulBadge label="Recent Contributions" color={config.colors.accent} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                        {[{ name: "Adaeze N.", amount: "\u20A625,000", status: "Paid", color: "#059669" }, { name: "Tunde O.", amount: "\u20A625,000", status: "Paid", color: "#059669" }, { name: "Funke A.", amount: "\u20A625,000", status: "Pending", color: "#D97706" }].map((c) => (
                          <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "#FAF9F5", transition: "background-color 0.2s ease" }}>
                            <span style={{ fontSize: "11px", fontWeight: 500, color: "#2D2D2D" }}>{c.name}</span>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: c.color, backgroundColor: `${c.color}12`, padding: "0.125rem 0.5rem", borderRadius: "0.375rem" }}>{c.status}</span>
                              <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#2D2D2D" }}>{c.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScaleIn>

                  {/* Growth Chart Card */}
                  <ScaleIn delay={500}>
                    <div style={{ background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1rem", padding: "1.5rem", height: "100%", borderTop: `3px solid ${config.colors.primary}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                      <ColorfulBadge label="Savings Growth" color="#1E3D2A" />
                      <div style={{ marginTop: "1rem" }}>
                        <SavingsGrowthChart />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }}>
                        <span style={{ fontSize: "10px", color: "#7A7A7A" }}>Jan</span>
                        <span style={{ fontSize: "10px", color: "#7A7A7A" }}>Jul</span>
                      </div>
                    </div>
                  </ScaleIn>
                </div>
              </div>
            </FadeInUp>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" style={{ padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)", background: `linear-gradient(180deg, ${config.colors.background} 0%, #EDEAE2 50%, ${config.colors.background} 100%)` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <FadeInUp>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <ColorfulBadge label="Simple Process" color={config.colors.primary} />
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.025em", marginTop: "0.75rem" }}>
                  How <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 500 }}>Arosco</span> works
                </h2>
              </div>
            </FadeInUp>

            <StaggerChildren staggerDelay={150} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
              {[
                { step: "01", title: "Create or Join a Circle", desc: "Start a thrift group with people you trust, or join an existing circle in your community.", color: "#2D5A3D", bgColor: "#2D5A3D10" },
                { step: "02", title: "Contribute Each Cycle", desc: "Pay your fixed amount every cycle. Contributions are tracked transparently for all members to see.", color: "#B8860B", bgColor: "#B8860B10" },
                { step: "03", title: "Collect Your Pot", desc: "When your turn comes, receive the full collected amount from all members. Build your savings systematically.", color: "#1E3D2A", bgColor: "#1E3D2A10" },
              ].map((s) => (
                <div key={s.step} style={{ textAlign: "center", padding: "2rem 1.5rem", background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1rem", borderTop: `3px solid ${s.color}30`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "2.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.color, opacity: 0.2, display: "block", marginBottom: "0.5rem" }}>{s.step}</span>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", marginBottom: "0.5rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "13px", color: "#5A5A5A", fontWeight: 300, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ background: `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%)`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-5rem", right: "-5rem", width: "20rem", height: "20rem", background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-8rem", left: "-4rem", width: "16rem", height: "16rem", background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
            <FadeInUp>
              <div style={{ maxWidth: "540px", marginBottom: "3rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.8)", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.6)" }} />
                  Platform Features
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.025em", marginTop: "0.75rem", marginBottom: "0.75rem" }}>
                  Everything you need to manage <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>thrift circles</span>
                </h2>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.7 }}>
                  A complete platform for communal savings \u2014 from contribution tracking to secure payouts.
                </p>
              </div>
            </FadeInUp>

            <StaggerChildren staggerDelay={100} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
              {features.map((f) => (
                <div key={f.title} style={{ padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", transition: "all 0.3s ease" }}>
                  <div style={{ display: "block", marginBottom: "0.75rem", color: "rgba(255,255,255,0.8)" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "0.375rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", fontWeight: 300, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)", background: `linear-gradient(180deg, ${config.colors.background} 0%, #EDEAE2 50%, ${config.colors.background} 100%)` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <FadeInUp>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <ColorfulBadge label="Trusted by Communities" color={config.colors.accent} />
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.025em", marginTop: "0.75rem" }}>
                  Real <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 500 }}>savings</span>, real people
                </h2>
              </div>
            </FadeInUp>

            <StaggerChildren staggerDelay={150} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {testimonials.map((t) => (
                <div key={t.name} style={{ padding: "1.5rem", background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAF5 100%)`, borderRadius: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: `1px solid ${t.color}10`, transition: "all 0.3s ease" }}>
                  <div style={{ width: "32px", height: "3px", backgroundColor: t.color, borderRadius: "2px", marginBottom: "1rem", opacity: 0.6 }} />
                  <p style={{ fontSize: "13px", color: "#2D2D2D", fontWeight: 300, lineHeight: 1.7, marginBottom: "1.25rem", fontStyle: "italic" }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, transition: "transform 0.2s ease" }}>{t.name.charAt(0)}</div>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{t.name}</span>
                      <span style={{ fontSize: "10px", color: "#7A7A7A" }}>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* CTA */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <GradientStrip colors={["#2D5A3D", "#B8860B", "#1E3D2A", "#8B6914", "#3D7A52"]} height={4} />
          <div style={{ background: `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 60%, #1A2F1F 100%)`, padding: "clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)", color: "#ffffff", position: "relative" }}>
            <div style={{ position: "absolute", top: "-5rem", right: "-5rem", width: "20rem", height: "20rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "-8rem", left: "-4rem", width: "16rem", height: "16rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", top: "30%", left: "60%", width: "12rem", height: "12rem", background: `radial-gradient(circle, ${config.colors.accent}15 0%, transparent 70%)`, borderRadius: "50%" }} />

            <FadeInUp>
              <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, opacity: 0.7, display: "block", marginBottom: "0.75rem" }}>Start Saving Today</span>
                <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>
                  Ready to join an <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>Ajo circle</span>?
                </h2>
                <p style={{ fontSize: "14px", opacity: 0.8, fontWeight: 300, marginBottom: "2rem", lineHeight: 1.7 }}>
                  Create a free circle or join an existing one. Start building your savings with people you trust.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <a href="/pricing" style={{ padding: "0.75rem 2rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#ffffff", color: config.colors.primary, textDecoration: "none", transition: "all 0.25s ease" }}>View Plans</a>
                  <a href="/donate" style={{ padding: "0.75rem 2rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "transparent", color: "#ffffff", textDecoration: "none", transition: "all 0.25s ease" }}>Make a Donation</a>
                  <a href="mailto:hello@arosco.app" style={{ padding: "0.75rem 2rem", borderRadius: "9999px", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "transparent", color: "#ffffff", textDecoration: "none", transition: "all 0.25s ease" }}>Contact Us</a>
                </div>
              </div>
            </FadeInUp>
          </div>
        </section>
      </main>
    </>
  );
}
