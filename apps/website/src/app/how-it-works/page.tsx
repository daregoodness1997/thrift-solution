import { Check } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How GFW Works — Ajo Savings in 3 Simple Steps",
  description: "Create or join a thrift circle, contribute each cycle, and collect your pot. Learn how GFW makes communal savings secure and transparent.",
};

const steps = [
  { step: "01", title: "Create or Join a Circle", description: "Start a thrift group with people you trust, or join an existing circle in your community. Set your contribution amount and cycle frequency.", details: ["Flexible contribution amounts", "Daily, weekly, or monthly cycles", "Invite members by link or code"] },
  { step: "02", title: "Contribute Each Cycle", description: "Pay your fixed amount every cycle. Contributions are held securely and tracked transparently for all members to see.", details: ["Secure escrow protection", "Real-time contribution tracking", "Automated payment reminders"] },
  { step: "03", title: "Collect Your Pot", description: "When your turn comes, receive the full collected amount from all members. Build your savings systematically over time.", details: ["Guaranteed payout schedule", "Trust score builds each cycle", "No manual coordination"] },
];

const faqs = [
  { q: "What is GFW?", a: "GFW (also called Ajo) is a traditional Nigerian communal thrift savings system. Members contribute a fixed amount each cycle and take turns receiving the total pot. It's built on trust and community." },
  { q: "How is my money protected?", a: "Contributions are held in a secure escrow until payout time. Funds are released only to the designated recipient when the cycle closes." },
  { q: "What if a member doesn't pay?", a: "Members with missed payments receive automatic reminders. Their trust score is affected, and circle leaders can set policies for handling defaults." },
  { q: "Can I join multiple circles?", a: "Yes. You can be a member of as many circles as you can manage. Your dashboard tracks all your active circles and contribution schedules." },
];

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-brand-cream pt-32">
      <section className="border-b border-brand-primary/10 bg-gradient-to-b from-brand-primary/[0.06] to-brand-cream px-6 pb-16 pt-10">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge>Simple Process</Badge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
              How <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">GFW</span> works
            </h1>
            <p className="mt-4 text-base font-light text-brand-muted">
              Three simple steps to start saving with your community.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="flex flex-col gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="overflow-hidden rounded-2xl border-t-[3px] border-brand-primary/30 bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <span className="font-mono text-4xl font-bold text-brand-primary opacity-20">{s.step}</span>
                  <h2 className="mt-2 text-xl font-semibold text-brand-dark">{s.title}</h2>
                  <p className="mt-2 text-sm font-light leading-relaxed text-brand-muted">{s.description}</p>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  {s.details.map((d, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm text-brand-dark">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-brand-dark">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-dark">{faq.q}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-brand-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 p-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-brand-dark">Ready to start saving?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-light text-brand-muted">
            Create a free circle or join an existing one today.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/register" size="lg">Get Started Free</Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
