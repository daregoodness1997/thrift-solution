import { GraduationCap, Briefcase, Lightbulb, Globe2, ShieldCheck, Users } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const features = [
  { icon: GraduationCap, title: "Access to Education & Tech Training", desc: "Quality training in digital skills and technology for people everywhere, regardless of location or background.", color: "#1D4ED8" },
  { icon: Briefcase, title: "Expanded Economic Opportunities", desc: "Better jobs, entrepreneurship, and remote work pathways that lead to greater financial security for individuals and families.", color: "#0EA5E9" },
  { icon: Lightbulb, title: "Empowerment Through Knowledge", desc: "Access to technology, financial tools, and education gives people more control over their lives and futures.", color: "#3B82F6" },
  { icon: Globe2, title: "Innovation & Global Collaboration", desc: "People from different countries and cultures share ideas and solve problems together, driving progress worldwide.", color: "#38BDF8" },
  { icon: ShieldCheck, title: "Reduced Barriers to Opportunity", desc: "Easier access to healthcare information, banking, government services, and global markets for underserved communities.", color: "#1E3A8A" },
  { icon: Users, title: "Stronger, More Resilient Communities", desc: "Education and economic opportunity contribute to improved well-being, resilience, and collective prosperity.", color: "#3B82F6" },
];

export function Features() {
  return (
    <section id="features" className="bg-gradient-to-b from-brand-cream via-brand-surface/40 to-brand-cream dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20">
      <Container>
        <SectionHeading
          eyebrow="Our Mission"
          title={
            <>
              Expanding opportunity so everyone can{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                learn, grow, and thrive
              </span>
            </>
          }
          description="We're building a world where education, technology, and economic empowerment are accessible to all — no matter where you start."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white dark:bg-slate-900 dark:border-slate-800 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1 opacity-80 transition-all duration-300 group-hover:h-1.5"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                />
                <div
                  className="mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${f.color}14`, color: f.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-brand-dark dark:text-slate-100">{f.title}</h3>
                <p className="text-sm font-light leading-relaxed text-brand-muted dark:text-slate-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
