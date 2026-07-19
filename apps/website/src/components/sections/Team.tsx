import { Container, SectionHeading } from "@/components/ui/Section";

const team = [
  {
    name: "Osarodion Francis",
    role: "Chief Executive Officer",
    bio: "Leads GFW's vision to modernize communal thrift savings across Africa.",
    location: "Lagos, Nigeria",
    photo: "/ceo.jpeg",
  },
  {
    name: "Osarodion Deborah",
    role: "Chief Operating Officer",
    bio: "Keeps every circle running smoothly and our members supported day to day.",
    location: "Lagos, Nigeria",
    photo: "/coo.jpeg",
  },
  {
    name: "Helen Sunday",
    role: "Head of Department",
    bio: "Owns the teams and processes that deliver a reliable GFW experience.",
    location: "Lagos, Nigeria",
    photo: "/hod.jpeg",
  },
  {
    name: "Felix Agbonifo",
    role: "Compliance Lead",
    bio: "Ensures every transaction stays secure, transparent, and compliant.",
    location: "Lagos, Nigeria",
    photo: "/compliance.jpeg",
  },
  {
    name: "Nwaogu Chinedu",
    role: "Coordinator",
    bio: "Connects our circles and helps communities get the most from GFW.",
    location: "Lagos, Nigeria",
    photo: "/cordinator.jpeg",
  },
  {
    name: "Korede Awe",
    role: "Field Coordinator",
    bio: "Brings GFW to communities on the ground, one circle at a time.",
    location: "Lagos, Nigeria",
    photo: "/cord-1.jpeg",
  },
  {
    name: "Sam Imoje",
    role: "Director",
    bio: "Brings GFW to communities on the ground, one circle at a time.",
    location: "Germany",
    photo: "/director-2.jpeg",
  },
  {
    name: "Omoruwa Oghagbon",
    role: "Director",
    bio: "Brings GFW to communities on the ground, one circle at a time.",
    location: "Italy",
    photo: "/director-1.jpeg",
  },
  {
    name: "Courage Omoruyi",
    role: "Community Manager",
    bio: "Brings GFW to communities on the ground, one circle at a time.",
    location: "Lagos, Nigeria",
    photo: "/cord-2.jpeg",
  },
];

export function Team() {
  return (
    <section className="bg-brand-cream py-20">
      <Container>
        <SectionHeading
          eyebrow="Our Team"
          title={
            <>
              Meet the people behind{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                GFW
              </span>
            </>
          }
          description="A passionate team building the modern home for communal thrift savings."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="group overflow-hidden rounded-3xl border border-brand-primary/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold text-brand-dark">
                  {member.name}
                </h3>
                <p className="mt-0.5 text-sm font-semibold text-brand-accent">
                  {member.role}
                </p>
                <p className="mt-0.5 text-sm ">{member.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
