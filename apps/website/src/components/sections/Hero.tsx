import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { DASHBOARD_URL } from "../SiteHeader";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-brand-primary/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-brand-accent/5 blur-2xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 text-left lg:col-span-7">
          <div
            className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/15 bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 px-4 py-1.5"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-accent" />
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-secondary">
              <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
              Communal savings, reimagined
            </span>
          </div>

          <h1
            className="animate-fade-up font-display text-4xl font-extrabold leading-tight tracking-tight text-brand-dark sm:text-5xl md:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            The modern way to{" "}
            <span className="bg-gradient-to-r from-brand-primary via-brand-sage to-brand-accent bg-clip-text text-transparent">
              save together
            </span>
          </h1>

          <p
            className="animate-fade-up max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            GFW brings the centuries-old trust of Ajo into the digital age.
            Track contributions transparently, protect funds in secure escrow,
            and automate payouts for your community.
          </p>

          <div
            className="animate-fade-up my-2 grid max-w-lg grid-cols-3 gap-4 border-y border-brand-primary/10 py-4"
            style={{ animationDelay: "240ms" }}
          >
            <div>
              <p className="font-display text-xl font-bold text-brand-dark">
                ₦4.2M+
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Total Saved</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-brand-dark">
                1,200+
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Active Members</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-brand-dark">
                340
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Circles</p>
            </div>
          </div>

          <div
            className="animate-fade-up flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "320ms" }}
          >
            <a
              href={`${DASHBOARD_URL}/login`}
              target="_blank"
              className="flex items-center justify-center gap-2 rounded-full bg-brand-accent px-8 py-4 font-bold text-white shadow-lg shadow-brand-accent/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-gold hover:shadow-xl"
            >
              Start a Circle <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/how-it-works"
              className="flex items-center justify-center gap-2 rounded-full border border-brand-primary/20 bg-white px-8 py-4 font-bold text-brand-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-md"
            >
              See How It Works{" "}
              <ArrowUpRight className="h-5 w-5 text-gray-500" />
            </Link>
          </div>

          <div
            className="animate-fade-up mt-2 flex items-center gap-2 text-xs text-gray-500"
            style={{ animationDelay: "400ms" }}
          >
            <ShieldCheck className="h-4 w-4 text-brand-sage" />
            <span>
              Escrow-protected funds · KYC &amp; BVN verified · SSL encrypted
            </span>
          </div>
        </div>

        {/* Featured images */}
        <div className="relative mt-8 lg:col-span-5 lg:mt-0">
          <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-brand-sage/30 blur-2xl" />

          <div className="animate-img-in relative overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1755705153160-67b29c7718ee?auto=format&fit=crop&w=900&q=80"
              alt="A group of friends laughing together outdoors"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          <div
            className="animate-img-in absolute -right-4 top-8 w-2/5 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl md:w-1/2"
            style={{ animationDelay: "200ms" }}
          >
            <img
              src="https://images.unsplash.com/photo-1755705152604-af6804fb8932?auto=format&fit=crop&w=500&q=80"
              alt="Friends enjoying time together"
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          <div
            className="animate-fade-up absolute -bottom-6 -left-4 hidden max-w-[200px] rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-xl md:block"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="rounded bg-green-100 p-1 text-green-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-brand-dark">
                Trusted by communities
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-normal text-gray-500">
              Escrow-protected savings for circles across Nigeria.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
