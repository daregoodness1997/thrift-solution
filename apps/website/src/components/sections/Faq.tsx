"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/Section";

const faqs = [
  { q: "What is Arosco (Ajo)?", a: "Arosco is a digital platform for traditional Nigerian communal thrift savings. Members contribute a fixed amount each cycle and take turns receiving the total pot — built on trust and community." },
  { q: "How is my money protected?", a: "Contributions are held in secure escrow until payout time. Funds are released only to the designated recipient when the cycle closes, and every transaction is tracked transparently." },
  { q: "What if a member doesn't pay?", a: "Members with missed payments receive automatic reminders. Their trust score is affected, and circle leaders can set policies for handling defaults." },
  { q: "Can I join multiple circles?", a: "Yes. You can be a member of as many circles as you can manage. Your dashboard tracks all active circles and contribution schedules." },
  { q: "How much does it cost?", a: "Starter circles are free. Paid plans unlock larger circles, advanced analytics, and API access. See our pricing page for details." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-brand-cream py-20">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions,{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                answered
              </span>
            </>
          }
        />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-brand-primary/10 overflow-hidden rounded-2xl border border-brand-primary/10 bg-white">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-brand-dark">{f.q}</span>
                  <span className="shrink-0 rounded-full bg-brand-primary/10 p-1.5 text-brand-primary">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div
                  className={`overflow-hidden px-6 transition-all duration-300 ${
                    isOpen ? "max-h-48 pb-5" : "max-h-0"
                  }`}
                >
                  <p className="text-sm font-light leading-relaxed text-brand-muted">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
