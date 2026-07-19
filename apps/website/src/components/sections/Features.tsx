import { Handshake, Wallet, Award, HeartHandshake, LineChart, ShieldCheck } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const features = [
  { icon: Handshake, title: "Ajo Circles", desc: "Join or create contribution groups. Members contribute a fixed amount each cycle and take turns receiving the full pot.", color: "#1D4ED8" },
  { icon: Wallet, title: "Thrift Collections", desc: "Track every contribution in real time. Transparent ledgers so every member sees exactly where the money goes.", color: "#0EA5E9" },
  { icon: Award, title: "Trust Score", desc: "Build your reputation through consistent contributions. A visible trust score backed by your actual payment history.", color: "#3B82F6" },
  { icon: HeartHandshake, title: "Donations", desc: "Donate funds or items to support your circles and community. Multiple payment providers, instant confirmation.", color: "#38BDF8" },
  { icon: LineChart, title: "Savings Tracker", desc: "Monitor total contributions, payouts, and savings growth. See your financial discipline in real numbers.", color: "#1E3A8A" },
  { icon: ShieldCheck, title: "Secure Escrow", desc: "Contributions are held in secure escrow until payout time. Funds are protected until every member has paid.", color: "#3B82F6" },
];

export function Features() {
  return (
    <section id="features" className="bg-gradient-to-b from-brand-cream via-brand-surface/40 to-brand-cream py-20">
      <Container>
        <SectionHeading
          eyebrow="Platform Features"
          title={
            <>
              Everything you need to run{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                thrift circles
              </span>
            </>
          }
          description="A complete toolkit for communal savings — from contribution tracking to secure, automated payouts."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 opacity-80 transition-all duration-300 group-hover:h-1.5"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                />
                <div
                  className="mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${f.color}14`, color: f.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-brand-dark">{f.title}</h3>
                <p className="text-sm font-light leading-relaxed text-brand-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
