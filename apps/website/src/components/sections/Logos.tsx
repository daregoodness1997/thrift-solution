const partners = [
  "Lagos Family Circles",
  "Market Women Co-op",
  "Youth Corps Savers",
  "Office Colleagues",
  "Community Dev Fund",
  "Church Thrift Group",
  "Traders Alliance",
  "Students Ajo",
  "Diaspora Support",
  "Cooperative Union",
];

export function Logos() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-brand-primary/10 bg-white/60 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Trusted by thrift communities across Nigeria
        </p>
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-marquee gap-10">
            {row.map((p, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-display text-lg font-semibold text-brand-dark/40"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-brand-cream to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-brand-cream to-transparent" />
        </div>
      </div>
    </section>
  );
}
