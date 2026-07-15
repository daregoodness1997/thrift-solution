import { formatNaira } from "@thrift/utils";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

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

const stats = [
  { label: "Total Saved", value: "₦4.2M", sub: "by our community" },
  { label: "Active Members", value: "1,200+", sub: "across 8 states" },
  { label: "Completed Circles", value: "340", sub: "and counting" },
];

export default function About() {
  return (
    <main className="min-h-screen bg-brand-cream pt-32">
      <section className="border-b border-brand-primary/10 bg-gradient-to-b from-brand-primary/[0.06] to-brand-cream px-6 pb-16 pt-10">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge>Our Story</Badge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
              Modernizing <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">Ajo</span>, one circle at a time.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-brand-muted">
              Arosco is a digital platform for traditional communal thrift
              savings. We bring the trust and discipline of Ajo into the modern
              era with transparent tracking, secure escrow, and smart
              automation.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-brand-primary/10 bg-white p-7 text-center shadow-sm">
              <p className="font-display text-3xl font-bold text-brand-primary">{s.value}</p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">{s.label}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-brand-dark">Our Values</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {values.map((v, i) => (
              <div key={v.name} className="rounded-2xl border-t-[3px] border-brand-primary/30 bg-white p-7 shadow-sm">
                <span className="font-mono text-2xl font-bold text-brand-primary opacity-20">0{i + 1}</span>
                <h3 className="mt-2 text-base font-semibold text-brand-dark">{v.name}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-brand-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 p-10 text-center">
          <Badge className="mb-4">Our Mission</Badge>
          <h2 className="mx-auto max-w-2xl font-display text-2xl font-semibold leading-snug text-brand-dark">
            We believe every community deserves a{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">secure way to save together</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-light leading-relaxed text-brand-muted">
            Arosco makes it easy to create, manage, and participate in Ajo
            circles — with the transparency and security the modern era demands.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-brand-dark">Milestones</h2>
          <div className="flex flex-col gap-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-brand-primary/10 bg-brand-primary/[0.04] px-4 py-3">
                <span className="shrink-0 font-mono text-xs font-bold text-brand-primary">{m.year}</span>
                <span className="text-sm text-brand-dark">{m.event}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-xl font-semibold text-brand-dark">Get In Touch</h2>
          <p className="mt-2 text-sm font-light text-brand-muted">Have questions? We&apos;d love to hear from you.</p>
          <div className="mt-4">
            <Button href="mailto:hello@arosco.app">hello@arosco.app</Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
