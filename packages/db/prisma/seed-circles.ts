import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.circle.count();
  if (existing > 0) {
    console.log(`Found ${existing} existing circles, skipping seed.`);
    return;
  }

  const circles = [
    {
      name: "Bronze Circle",
      description: "Start saving with a low entry amount. 8% annual interest.",
      amount: 5000,
      durationMonths: 6,
      interestRateAnnual: 8,
      maxAccountsPerUser: 10,
      status: "active",
    },
    {
      name: "Silver Circle",
      description: "Mid-tier savings circle. 10% annual interest over 12 months.",
      amount: 10000,
      durationMonths: 12,
      interestRateAnnual: 10,
      maxAccountsPerUser: 10,
      status: "active",
    },
    {
      name: "Gold Circle",
      description: "Premium savings with the best returns. 12% annual interest.",
      amount: 25000,
      durationMonths: 12,
      interestRateAnnual: 12,
      maxAccountsPerUser: 5,
      status: "active",
    },
    {
      name: "Platinum Circle",
      description: "High-value savings circle for serious investors. 15% annual interest.",
      amount: 50000,
      durationMonths: 12,
      interestRateAnnual: 15,
      maxAccountsPerUser: 3,
      status: "active",
    },
  ];

  for (const circle of circles) {
    await prisma.circle.create({ data: circle });
    console.log(`Created circle: ${circle.name} (${circle.amount} / ${circle.durationMonths}mo / ${circle.interestRateAnnual}%)`);
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
