import { Container, SectionHeading } from "@/components/ui/Section";

const team = [
  {
    name: "Osarodion Francis",
    role: "Chief Executive Officer",
    bio: "Leads the vision to expand access to education, technology, and economic opportunity worldwide.",
    location: "Lagos, Nigeria",
    photo: "/ceo.jpeg",
  },
  {
    name: "Osarodion Deborah",
    role: "Chief Operating Officer",
    bio: "Ensures programs run smoothly so learners and communities get the support they need.",
    location: "Lagos, Nigeria",
    photo: "/coo.jpeg",
  },
  {
    name: "Helen Sunday",
    role: "Head of Department",
    bio: "Owns the teams and processes that deliver impactful training and empowerment programs.",
    location: "Lagos, Nigeria",
    photo: "/hod.jpeg",
  },
  {
    name: "Felix Agbonifo",
    role: "Compliance Lead",
    bio: "Ensures every program stays secure, transparent, and aligned with our mission.",
    location: "Lagos, Nigeria",
    photo: "/compliance.jpeg",
  },
  {
    name: "Nwaogu Chinedu",
    role: "Coordinator",
    bio: "Connects learners with opportunities and helps communities access the tools they need.",
    location: "Lagos, Nigeria",
    photo: "/cordinator.jpeg",
  },
  {
    name: "Korede Awe",
    role: "Field Coordinator",
    bio: "Brings training and resources to communities on the ground, one person at a time.",
    location: "Lagos, Nigeria",
    photo: "/cord-1.jpeg",
  },
  {
    name: "Sam Imoje",
    role: "Director",
    bio: "Expands global partnerships to create more pathways for education and economic inclusion.",
    location: "Germany",
    photo: "/director-2.jpeg",
  },
  {
    name: "Omoruwa Oghagbon",
    role: "Director",
    bio: "Builds international bridges so opportunity reaches people across borders and cultures.",
    location: "Italy",
    photo: "/director-1.jpeg",
  },
  {
    name: "Courage Omoruyi",
    role: "Community Manager",
    bio: "Fosters engaged learning communities where people support each other's growth.",
    location: "Lagos, Nigeria",
    photo: "/cord-2.jpeg",
  },
  {
    name: "Itohan Mercy Ekhoragbon",
    role: "Admin & Community Manager",
    bio: "Fosters engaged learning communities where people support each other's growth.",
    location: "Lagos, Nigeria",
    photo: "/admin.jpeg",
  },
];

export function Team() {
  return (
    <section className="bg-brand-cream dark:bg-slate-950 py-20">
      <Container>
        <SectionHeading
          eyebrow="Our Team"
          title={
            <>
              Meet the people behind{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                our mission
              </span>
            </>
          }
          description="A passionate team dedicated to expanding access to education, technology, and economic opportunity for all."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="group overflow-hidden rounded-3xl border border-brand-primary/10 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold text-brand-dark dark:text-slate-100">
                  {member.name}
                </h3>
                <p className="mt-0.5 text-sm font-semibold text-brand-accent">
                  {member.role}
                </p>
                <p className="mt-0.5 text-sm text-brand-muted dark:text-slate-400">
                  {member.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
