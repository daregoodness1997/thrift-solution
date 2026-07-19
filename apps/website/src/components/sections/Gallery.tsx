import { Quote, MapPin } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const testimonials = [
  { name: "Adaeze N.", role: "Circle Leader", text: "GFW helped me organize our church thrift group. Everyone pays on time, and we've completed five full cycles without a single default.", color: "#1D4ED8" },
  { name: "Tunde O.", role: "Member", text: "I used my Ajo payout to fund my small business. Having a structured savings system made all the difference.", color: "#0EA5E9" },
  { name: "Funke A.", role: "Circle Organizer", text: "Managing contributions used to be a nightmare of spreadsheets. GFW automates everything — reminders, tracking, and payouts.", color: "#1E3A8A" },
];

const locations = [
  "Lagos", "Abuja", "Ibadan", "Enugu", "Kano", "Port Harcourt",
  "Benin", "Abeokuta", "Ilorin", "Owerri", "Kaduna", "Akure",
];

export function Gallery() {
  return (
    <section className="bg-gradient-to-b from-white/60 to-brand-cream py-20">
      <Container>
        <SectionHeading
          eyebrow="Community Impact"
          title={
            <>
              Real savings,{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                real people
              </span>
            </>
          }
          description="From family circles to market cooperatives, communities across Nigeria are saving together on GFW."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-2xl border border-white/70 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 h-0.5 w-8 rounded" style={{ backgroundColor: t.color, opacity: 0.6 }} />
              <Quote className="mb-3 h-7 w-7" style={{ color: t.color }} />
              <p className="text-sm font-light italic leading-relaxed text-brand-dark">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)` }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-dark">{t.name}</p>
                  <p className="text-[10px] text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-brand-primary/10 bg-white p-8">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-brand-dark">
            <MapPin className="h-4 w-4 text-brand-accent" />
            Circles active across 8+ states
          </div>
          <div className="flex flex-wrap gap-3">
            {locations.map((l) => (
              <span
                key={l}
                className="rounded-full border border-brand-primary/15 bg-brand-primary/5 px-4 py-1.5 text-xs font-medium text-brand-secondary"
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
