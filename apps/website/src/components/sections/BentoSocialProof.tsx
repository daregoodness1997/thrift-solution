import { Star, MapPin } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const U = "https://images.unsplash.com";
const img = (id: string, w: number) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Large featured photo (top-left, 2x2)
const bigGroup = img("photo-1763901326436-256ad090a6c9", 900);

// Happy faces (order matters for the grid auto-placement)
const faces = [
  img("photo-1687360440094-949b8fe71c8c", 500),
  img("photo-1769636929354-59165ba73c7e", 500),
  img("photo-1687360440648-ec9708d52086", 500),
  img("photo-1759300063434-482e4d65f9bf", 500),
  img("photo-1687360440741-f5df549b352d", 500),
  img("photo-1752650143052-fab46a8c2735", 500),
  img("photo-1752650143077-dee2c33a976c", 500),
  img("photo-1758272133786-ee98adcc6837", 500),
  img("photo-1758272133803-1cbb513689ca", 500),
];

export function BentoSocialProof() {
  return (
    <section className="bg-brand-cream dark:bg-slate-950 py-20">
      <Container>
        <SectionHeading
          eyebrow="Social Proof"
          title={
            <>
              Loved by savers across{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Nigeria
              </span>
            </>
          }
          description="Real circles, real faces, real results. Here's a glimpse of the communities building wealth together on GFW."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-6 lg:grid-rows-3">
          {/* Featured happy group (2x2) */}
          <div className="group relative col-span-2 row-span-2 overflow-hidden rounded-3xl border border-brand-primary/10 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <img
              src={bigGroup}
              alt="A happy group of friends enjoying time together"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-brand-dark/85 to-transparent p-5 pt-10 text-sm font-medium text-white">
              <MapPin className="h-4 w-4 text-brand-gold" /> Circles in 8+ states
            </div>
          </div>

          {/* Faces — row 1 (cols 3-6) */}
          {faces.slice(0, 4).map((src, i) => (
            <FaceTile key={i} src={src} />
          ))}

          {/* Faces — row 2 (cols 3-4) */}
          {faces.slice(4, 6).map((src, i) => (
            <FaceTile key={i + 4} src={src} />
          ))}

          {/* Rating tile (row 2, cols 5-6) */}
          <div className="col-span-2 row-span-1 flex flex-col justify-center rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary to-brand-secondary p-6 text-white shadow-sm">
            <div className="flex items-center gap-1 text-brand-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-3 font-display text-3xl font-bold">4.9/5</p>
            <p className="text-xs text-white/70">Average rating from 1,200+ members</p>
          </div>

          {/* Wide face (row 3, cols 1-2) */}
          <div className="group relative col-span-2 row-span-1 overflow-hidden rounded-3xl border border-brand-primary/10 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <img
              src={faces[6]}
              alt="Smiling community member"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Faces — row 3 (cols 3-4) */}
          {faces.slice(7, 9).map((src, i) => (
            <FaceTile key={i + 7} src={src} />
          ))}

          {/* CTA tile (row 3, cols 5-6) */}
          <div className="col-span-2 row-span-1 flex flex-col items-start justify-center rounded-3xl border border-brand-accent/30 bg-gradient-to-br from-brand-accent to-brand-gold p-6 text-white shadow-sm">
            <p className="font-display text-lg font-bold">Start your circle</p>
            <p className="mt-1 text-xs text-white/85">Join 1,200+ members saving together</p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Badge className="border-brand-primary/15 bg-white dark:bg-slate-900 dark:border-slate-700 text-brand-secondary dark:text-blue-300">
            Join 1,200+ members saving together
          </Badge>
        </div>
      </Container>
    </section>
  );
}

function FaceTile({ src }: { src: string }) {
  return (
    <div className="group relative col-span-1 row-span-1 overflow-hidden rounded-3xl border border-brand-primary/10 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <img
        src={src}
        alt="Smiling community member"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}
