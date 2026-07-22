"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/Section";

const faqs = [
  { q: "What is our mission?", a: "We believe everyone deserves access to quality education, technology, and economic opportunity — regardless of location or background. Our platform connects people with the training, tools, and support they need to build secure, independent lives." },
  { q: "How do you expand access to education?", a: "We partner with training providers, offer digital skills programs, and create learning pathways that are accessible to people everywhere. Our focus is on practical, job-ready skills that lead to real opportunities." },
  { q: "How does economic empowerment work?", a: "We connect learners to job opportunities, remote work, and entrepreneurship resources. By combining skills training with financial tools and community support, we help people achieve greater financial security." },
  { q: "Can I contribute to this mission?", a: "Absolutely. You can donate to fund training programs, partner with us as an organization, or volunteer your skills. Every contribution helps expand opportunity for someone who needs it." },
  { q: "Who benefits from these programs?", a: "Anyone seeking to learn new skills, find better opportunities, or gain financial independence. We focus especially on underserved communities where access to education and opportunity is limited." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-brand-cream dark:bg-slate-950 py-20">
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

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-brand-primary/10 dark:divide-slate-700 overflow-hidden rounded-2xl border border-brand-primary/10 dark:border-slate-800 bg-white dark:bg-slate-900">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-brand-dark dark:text-slate-100">{f.q}</span>
                  <span className="shrink-0 rounded-full bg-brand-primary/10 dark:bg-blue-900/40 p-1.5 text-brand-primary dark:text-blue-400">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div
                  className={`overflow-hidden px-6 transition-all duration-300 ${
                    isOpen ? "max-h-48 pb-5" : "max-h-0"
                  }`}
                >
                  <p className="text-sm font-light leading-relaxed text-brand-muted dark:text-slate-400">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
