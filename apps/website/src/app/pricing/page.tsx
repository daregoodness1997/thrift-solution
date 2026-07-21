import { Check } from "lucide-react";
import { formatNaira } from "@thrift/utils";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — GFW Circle Plans",
  description: "Start free with up to 5 members. Upgrade for unlimited circles, secure escrow, and advanced analytics. Plans for every community.",
};

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

const faqs = [
  { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
  { q: "Is my money safe?", a: "All contributions are held in secure escrow until payout time. Funds are protected until the cycle closes and the designated recipient collects." },
  { q: "What happens if a member defaults?", a: "Members with missed payments receive automatic reminders. Their trust score is affected, and circle leaders can enforce contribution policies." },
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-brand-cream pt-32">
      <section className="border-b border-brand-primary/10 bg-gradient-to-b from-brand-primary/[0.06] to-brand-cream px-6 pb-16 pt-10">
        <Container>
          <SectionHeading
            eyebrow="Plans & Pricing"
            title={
              <>
                Choose your{" "}
                <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">circle plan</span>
              </>
            }
            description="Start free. Upgrade as your thrift circles grow."
          />
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl bg-white p-8 shadow-sm ${
                plan.popular ? "border-2 border-brand-primary" : "border border-gray-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute right-6 top-6 rounded-full bg-brand-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most Popular
                </span>
              )}
              <span className="rounded-md border border-brand-primary/15 bg-brand-primary/[0.06] px-2 py-1 font-mono text-[11px] font-bold text-brand-primary">
                {plan.members}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-brand-dark">{plan.name}</h3>
              <p className="mt-1 text-xs italic font-light text-brand-muted">{plan.tagline}</p>
              <p className="mt-4 text-sm font-light leading-relaxed text-brand-muted">{plan.description}</p>

              <div className="mt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Monthly</span>
                <p className="font-mono text-2xl font-bold text-brand-dark">
                  {plan.price === 0 ? "Free" : `${formatNaira(plan.price)}/mo`}
                </p>
              </div>

              <div className="mt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Included</span>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {plan.perks.map((perk, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-light text-brand-dark">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <Button
                  href="/register"
                  variant={plan.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-brand-dark">Plan Questions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-dark">{faq.q}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-brand-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
