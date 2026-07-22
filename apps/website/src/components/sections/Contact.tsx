import Link from "next/link";
import { ArrowRight, HeartHandshake, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Section";

export function Contact() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-dark px-6 py-20 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute left-[60%] top-[30%] h-48 w-48 rounded-full bg-brand-accent/10 blur-2xl" />

        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.15em] opacity-70">
              Join the Movement
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to expand{" "}
              <span className="italic text-brand-accent">opportunity</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm font-light opacity-80">
              Whether you want to learn, partner, or support — there's a place for you. Together we can build a world where everyone has the tools to thrive.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/donate"
                className="flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <HeartHandshake className="h-4 w-4" /> Support Our Mission
              </Link>
              <a
                href="mailto:hello@globalfreedomworldwide.com"
                className="flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              >
                Get in Touch <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
