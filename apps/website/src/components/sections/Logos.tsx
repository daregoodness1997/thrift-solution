const partners = [
  "Tech Training Hubs",
  "Global Education Partners",
  "Community Empowerment Fund",
  "Digital Skills Coalition",
  "Youth Opportunity Network",
  "Remote Work Alliance",
  "Innovation Labs Africa",
  "Women in Tech Initiative",
  "Diaspora Learning Network",
  "Financial Inclusion Group",
];

export function Logos() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-brand-primary/10 bg-white/60 dark:bg-slate-900/60 dark:border-slate-800 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
          Partnered with organizations expanding opportunity worldwide
        </p>
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-marquee gap-10">
            {row.map((p, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-display text-lg font-semibold text-brand-dark/40 dark:text-slate-400/50"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-brand-cream to-transparent dark:from-slate-950 dark:to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-brand-cream to-transparent dark:from-slate-950 dark:to-transparent" />
        </div>
      </div>
    </section>
  );
}
