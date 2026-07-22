import { prisma } from "../src/services/prisma";

async function seedImpactSpotlight() {
  console.log("Seeding Impact Spotlight data...");

  const narratives = [
    {
      name: "Amina Bello",
      age: 23,
      country: "Nigeria",
      countryCode: "🇳🇬",
      role: "Solar Microgrid Engineer & Fintech Developer",
      cohort: "Lagos Innovation Cohort #07",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "I used to study for WAEC exams by candlelight. Today, my solar-powered payment systems serve over 2,000 market traders.",
      impactMetric: "2,150",
      impactLabel: "Market Traders Using Digital Payments",
      longFormNarrative: [
        "Growing up in Ajegunle, Lagos, consistent electricity was a distant dream. Amina spent her secondary school years reading by candlelight, determined to overcome infrastructural barriers.",
        "In 2024, when the Lagos Innovation Hub opened its doors nearby, Amina was among the first cohort of applicants. Receiving a refurbished laptop, a ₦75,000 micro-grant stipend, and reliable internet access, she immersed herself in Python programming and embedded systems.",
        "Determined to solve payment challenges for local market women, Amina designed an offline-first mobile payment system powered by solar kiosks. Today, she leads a team of 35 female fellows who maintain 22 solar-powered payment points across Balogun and Mile 12 markets.",
      ],
      sortOrder: 1,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
          caption:
            "Amina installing a solar-powered payment kiosk at Balogun Market.",
          tag: "Hardware Setup",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption:
            "Training market women on USSD payment systems at Lagos Hub.",
          tag: "Community Training",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
          caption: "Graduation ceremony for certified fintech developers.",
          tag: "Certification",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "No Grid Access",
          description:
            "Studied for WAEC exams by candlelight with no personal computing device.",
          tag: "Initial State",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "Innovation Fellowship",
          description:
            "Received laptop, ₦75,000 stipend, and enrolled in 12-week intensive fintech & solar track.",
          tag: "Growth Stage",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Offline Payment Prototype",
          description:
            "Built USSD-based payment system running on solar kiosks serving 14 market blocks.",
          tag: "Innovation",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Community Tech Lead",
          description:
            "Appointed Lead Technical Fellow at Lagos Hub, training 35+ female engineers.",
          tag: "Leadership",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Chinedu Okafor",
      age: 27,
      country: "Nigeria",
      countryCode: "🇳🇬",
      role: "AgriTech Founder & Cassava Farmer",
      cohort: "Southeast Innovation Cohort #04",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "By combining traditional farming knowledge with AI crop diagnostics, we reduced post-harvest losses by 40%.",
      impactMetric: "₦45M+",
      impactLabel: "Saved for 200 Cassava Farmers",
      longFormNarrative: [
        "In the fertile lands outside Enugu, Chinedu watched his family's cassava farm struggle with devastating mosaic disease year after year. Without access to agricultural extension workers, diagnosis was often too late.",
        "Through GFW's Southeast AgriTech Cohort, Chinedu learned how to build offline computer vision models that run on affordable Android devices without needing data connectivity.",
        "He developed a mobile app that diagnoses cassava mosaic and brown streak diseases within seconds. Chinedu scaled this solution into a farmers' cooperative that now supports over 200 smallholder farming families across Anambra and Ebonyi states.",
      ],
      sortOrder: 2,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600",
          caption: "Scanning cassava leaves with AI diagnostic app in Enugu.",
          tag: "Field AI Test",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600",
          caption:
            "Demonstrating the app to local farmers' cooperative members.",
          tag: "Community Workshop",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
          caption: "Training youth on mobile-based crop monitoring systems.",
          tag: "Youth Training",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "Crop Disease Crisis",
          description:
            "Lost 40% of cassava harvest due to undetected mosaic virus outbreak.",
          tag: "Background",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "AI Agriculture Cohort",
          description:
            "Joined GFW AgriTech module; trained TensorFlow Lite model for crop diagnosis.",
          tag: "Education",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Pilot Deployment",
          description:
            "Tested app across 60 local farms, reducing diagnosis time from 2 weeks to 5 seconds.",
          tag: "Validation",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Cooperative Founder",
          description:
            "Established state-wide tech cooperative processing and exporting garri and starch.",
          tag: "Scale",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Fatima Abdullahi",
      age: 25,
      country: "Nigeria",
      countryCode: "🇳🇬",
      role: "Senior Cloud Developer & EdTech Advocate",
      cohort: "Kano Digital Skills Initiative #03",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "When financial hardship threatened my education, coding became my lifeline that no circumstance could sever.",
      impactMetric: "500+",
      impactLabel: "Girls Enrolled in Coding Programs",
      longFormNarrative: [
        "Born in Kano, Fatima faced significant barriers to continuing her education after secondary school due to financial constraints and cultural expectations.",
        "She discovered GFW's Northern Nigeria Digital Skills Initiative, which provided mentorship from tech professionals across Africa, solar-powered learning kits, and intensive full-stack development training.",
        "Within 10 months, Fatima passed her technical interviews and secured a remote cloud developer position with a pan-African fintech company. Today, she uses her earnings to fund scholarships for young girls while running weekend coding bootcamps in her community.",
      ],
      sortOrder: 3,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption: "Pair programming with a mentor at the Kano Innovation Hub.",
          tag: "Mentorship",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600",
          caption:
            "Presenting her final cloud architecture project to industry partners.",
          tag: "Project Demo",
          sortOrder: 2,
        },
        {
          url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
          caption: "Teaching young girls HTML and CSS at weekend bootcamp.",
          tag: "Community Impact",
          sortOrder: 3,
        },
      ],
      timeline: [
        {
          year: "2022",
          title: "Education Halted",
          description:
            "Unable to continue formal education due to financial constraints.",
          tag: "Challenge",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2023",
          title: "Digital Skills Fellowship",
          description:
            "Enrolled in full-stack engineering intensive with full data stipend support.",
          tag: "Training",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2024",
          title: "First Remote Job",
          description:
            "Hired as Junior Developer for pan-African fintech startup.",
          tag: "Milestone",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "Senior Developer & Mentor",
          description:
            "Promoted to Senior Engineer; sponsors coding education for 50+ girls annually.",
          tag: "Impact",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
    {
      name: "Tolu Adeyemi",
      age: 22,
      country: "Nigeria",
      countryCode: "🇳🇬",
      role: "HealthTech AI Architect",
      cohort: "Southwest Digital Health #09",
      avatarUrl:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400",
      coverImageUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
      headlineQuote:
        "We built predictive AI systems that ensure primary healthcare centers never run out of essential medicines.",
      impactMetric: "35",
      impactLabel: "PHCs with AI-Powered Supply Chain",
      longFormNarrative: [
        "In rural Ogun State, frequent stockouts of essential medicines threatened maternal health services and childhood immunization programs at primary healthcare centers.",
        "Tolu joined GFW's HealthTech fellowship, where she focused on predictive inventory optimization using machine learning algorithms trained on Nigerian health data.",
        "Her automated supply chain prediction system now ensures 35 primary healthcare centers across Ogun and Oyo states maintain adequate stock of essential medicines and vaccines.",
      ],
      sortOrder: 4,
      isActive: true,
      gallery: [
        {
          url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
          caption: "Installing health inventory tracking system at Ogun PHC.",
          tag: "HealthTech IoT",
          sortOrder: 1,
        },
        {
          url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
          caption: "Analyzing medicine supply data on local dashboard.",
          tag: "Data Analytics",
          sortOrder: 2,
        },
      ],
      timeline: [
        {
          year: "2023",
          title: "Medicine Stockouts",
          description:
            "PHCs ran out of essential drugs monthly, endangering maternal and child health.",
          tag: "Problem",
          status: "completed",
          sortOrder: 1,
        },
        {
          year: "2024",
          title: "HealthTech Fellowship",
          description:
            "Received grant for AI-powered inventory management system development.",
          tag: "Fellowship",
          status: "completed",
          sortOrder: 2,
        },
        {
          year: "2025",
          title: "Pilot Deployment",
          description:
            "Deployed predictive supply chain system across 12 PHCs in Ogun State.",
          tag: "Deploy",
          status: "completed",
          sortOrder: 3,
        },
        {
          year: "2026",
          title: "State-Wide Expansion",
          description:
            "Scaled system to 35 PHCs, ensuring consistent medicine availability.",
          tag: "Scale",
          status: "current",
          sortOrder: 4,
        },
      ],
    },
  ];

  for (const n of narratives) {
    const { gallery, timeline, ...narrativeData } = n;
    const created = await prisma.impactNarrative.create({
      data: {
        ...narrativeData,
        gallery: { create: gallery },
        timeline: { create: timeline },
      },
    });
    console.log(`Created narrative: ${n.name}`);
  }

  console.log(
    `Created ${narratives.length} narratives with gallery and timeline data`,
  );
  console.log("Impact Spotlight seeding complete!");
}

seedImpactSpotlight()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
