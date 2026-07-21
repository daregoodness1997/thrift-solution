import { Handshake, Wallet, Bell, ShieldCheck, Award, Megaphone } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Features — Ajo Circles & Savings Tools",
  description: "Explore GFW's features: Ajo circles, contribution tracking, smart reminders, secure escrow, trust scoring, and payout notifications.",
};

const features = [
  { icon: Handshake, title: "Ajo Circles", desc: "Create or join thrift groups with people you trust. Each circle has a fixed contribution amount and cycle schedule.", highlight: "Flexible group sizes" },
  { icon: Wallet, title: "Contribution Tracking", desc: "Transparent ledgers show every payment in real time. No more chasing people for money.", highlight: "Real-time updates" },
  { icon: Bell, title: "Smart Reminders", desc: "Automated alerts before contribution deadlines. Members never miss a payment.", highlight: "Never miss a cycle" },
  { icon: ShieldCheck, title: "Secure Escrow", desc: "Funds are held safely until payout time. Both the circle and individual members are protected.", highlight: "Protected funds" },
  { icon: Award, title: "Trust Scoring", desc: "Build your reputation through consistent contributions. Higher trust scores unlock larger circles.", highlight: "Build credibility" },
  { icon: Megaphone, title: "Payout Notifications", desc: "Get notified when it's your turn to collect, when contributions are due, and circle milestones.", highlight: "Stay informed" },
];

const circles = [
  { name: "Family Circle", desc: "Save together with relatives for school fees, holidays, and family projects." },
  { name: "Market Women Circle", desc: "Traders pooling resources to restock inventory and expand their businesses." },
  { name: "Office Colleagues", desc: "Coworkers building an emergency fund through structured weekly contributions." },
  { name: "Community Development", desc: "Neighborhood groups saving for local infrastructure and community events." },
];

export default function Marketplace() {
  return (
    <main className="min-h-screen bg-brand-cream pt-32">
      <section className="border-b border-brand-primary/10 bg-gradient-to-b from-brand-primary/[0.06] to-brand-cream px-6 pb-16 pt-10">
        <Container>
          <SectionHeading
            eyebrow="Platform Features"
            title={
              <>
                Built for{" "}
                <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">communal thrift</span>
              </>
            }
            description="Everything you need to manage Ajo circles — from contribution tracking to secure payouts."
          />
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group rounded-2xl border border-white/70 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-4 inline-flex rounded-xl bg-brand-primary/10 p-3 text-brand-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-brand-dark">{f.title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-brand-muted">{f.desc}</p>
                <span className="mt-4 inline-block rounded-md bg-brand-primary/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                  {f.highlight}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/[0.05] to-brand-accent/[0.05] p-10">
          <h2 className="text-xl font-semibold text-brand-dark">Popular Circle Types</h2>
          <p className="mt-1 text-sm font-light text-brand-muted">Communities already saving together on GFW.</p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {circles.map((c, i) => (
              <div key={c.name} className="rounded-2xl border-t-[3px] border-brand-primary/30 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-brand-dark">{c.name}</h4>
                <p className="mt-2 text-xs font-light leading-relaxed text-brand-muted">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
