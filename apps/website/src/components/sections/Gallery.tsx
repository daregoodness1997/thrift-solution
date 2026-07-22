import { Quote, MapPin } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const testimonials = [
  { name: "Adaeze N.", role: "Tech Trainee", text: "The digital skills training changed my life. I went from knowing nothing about tech to landing a remote job that supports my entire family.", color: "#1D4ED8" },
  { name: "Tunde O.", role: "Entrepreneur", text: "Access to business training and financial tools helped me start my own company. The community support was invaluable.", color: "#0EA5E9" },
  { name: "Funke A.", role: "Community Leader", text: "Seeing people in our community gain skills, find better jobs, and build confidence — that's what real empowerment looks like.", color: "#1E3A8A" },
];

const locations = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Rwanda", "Uganda",
  "Tanzania", "Ethiopia", "Senegal", "Cameroon", "India", "Philippines",
];

export function Gallery() {
  return (
    <section className="bg-gradient-to-b from-white/60 to-brand-cream dark:from-slate-900/60 dark:to-slate-950 py-20">
      <Container>
        <SectionHeading
          eyebrow="Community Impact"
          title={
            <>
              Real stories,{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                real transformation
              </span>
            </>
          }
          description="From first-time learners to thriving professionals, communities around the world are gaining skills and building better futures."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-2xl border border-white/70 bg-white dark:bg-slate-900 dark:border-slate-800 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 h-0.5 w-8 rounded" style={{ backgroundColor: t.color, opacity: 0.6 }} />
              <Quote className="mb-3 h-7 w-7" style={{ color: t.color }} />
              <p className="text-sm font-light italic leading-relaxed text-brand-dark dark:text-slate-200">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)` }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-dark dark:text-slate-100">{t.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-brand-primary/10 bg-white dark:bg-slate-900 dark:border-slate-800 p-8">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-brand-dark dark:text-slate-100">
            <MapPin className="h-4 w-4 text-brand-accent" />
            Learners and partners across 12+ countries
          </div>
          <div className="flex flex-wrap gap-3">
            {locations.map((l) => (
              <span
                key={l}
                className="rounded-full border border-brand-primary/15 bg-brand-primary/5 dark:bg-brand-primary/10 dark:border-brand-primary/20 px-4 py-1.5 text-xs font-medium text-brand-secondary dark:text-blue-300"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
