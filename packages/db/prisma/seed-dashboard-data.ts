import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const EMAIL = "daregoodness@gmail.com";

function generateAccountNumber(): string {
  return "GFW" + String(Math.floor(1000000000 + Math.random() * 9000000000));
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Seed Dashboard Data for daregoodness@gmail.com");
  console.log("═══════════════════════════════════════════\n");

  // 1. Find or create user
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.log("▸ Creating user...");
    const hash = await bcrypt.hash("Password@123", 10);
    user = await prisma.user.create({
      data: {
        name: "Dare Goodness",
        email: EMAIL,
        passwordHash: hash,
        role: "member",
        accountNumber: generateAccountNumber(),
        accountTier: "basic",
        referralCode: generateReferralCode(),
        emailVerified: true,
        bankName: "Wema Bank",
        bankCode: "035",
        bankAccountNumber: "0690000031",
        bankAccountName: "Dare Goodness",
      },
    });
    console.log(`  Created user: ${user.name} (${user.email})`);
  } else {
    console.log(`  Found existing user: ${user.name} (${user.email})`);
  }

  // 2. Ensure circles exist
  console.log("\n▸ Ensuring circles exist...");
  const circlesData = [
    { name: "Bronze Circle", amount: 5000, durationMonths: 6, interestRateAnnual: 8, weeklyAmount: 250, totalWeeks: 24 },
    { name: "Silver Circle", amount: 10000, durationMonths: 12, interestRateAnnual: 10, weeklyAmount: 250, totalWeeks: 48 },
    { name: "Gold Circle", amount: 25000, durationMonths: 12, interestRateAnnual: 12, weeklyAmount: 625, totalWeeks: 40 },
  ];

  const circles = [];
  for (const c of circlesData) {
    let circle = await prisma.circle.findFirst({ where: { name: c.name } });
    if (!circle) {
      circle = await prisma.circle.create({
        data: {
          name: c.name,
          description: `${c.name} savings circle`,
          cycleType: "weekly_contribution",
          amount: c.amount,
          weeklyAmount: c.weeklyAmount,
          totalWeeks: c.totalWeeks,
          durationMonths: c.durationMonths,
          interestRateAnnual: c.interestRateAnnual,
          maxAccountsPerUser: 2,
          autoPayout: false,
          payoutMode: "clearance",
          blockPayoutOnDefault: true,
          status: "active",
        },
      });
      console.log(`  Created circle: ${c.name}`);
    } else {
      console.log(`  Circle exists: ${c.name}`);
    }
    circles.push(circle);
  }

  // 3. Fund wallet
  console.log("\n▸ Funding wallet...");
  const existingBalance = await prisma.transaction.aggregate({
    where: { userId: user.id, status: "completed" },
    _sum: { amount: true },
  });
  const currentBalance = existingBalance._sum.amount || 0;

  if (currentBalance < 10000) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "wallet_funding",
        amount: 15000,
        reference: `SEED-FUND-${Date.now()}`,
        status: "completed",
        description: "Seed wallet funding",
      },
    });
    console.log("  Funded wallet with ₦15,000");
  } else {
    console.log(`  Wallet already has sufficient balance`);
  }

  // 4. Open circle accounts
  console.log("\n▸ Opening circle accounts...");
  const accounts = [];
  for (const circle of circles) {
    const existingAccount = await prisma.circleAccount.findFirst({
      where: { userId: user.id, circleId: circle.id, status: "active" },
    });

    if (!existingAccount) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Started 2 weeks ago
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + circle.durationMonths);

      const account = await prisma.circleAccount.create({
        data: {
          circle: { connect: { id: circle.id } },
          user: { connect: { id: user.id } },
          principalAmount: circle.weeklyAmount || circle.amount / 24,
          status: "active",
          weeksContributed: 2,
          startDate,
          maturityDate,
        },
      });
      accounts.push(account);
      console.log(`  Opened account in ${circle.name}`);

      // Create contribution records
      const weeklyAmt = circle.weeklyAmount || circle.amount / (circle.totalWeeks || 24);
      for (let week = 1; week <= 2; week++) {
        const contribDate = new Date(startDate);
        contribDate.setDate(contribDate.getDate() + (week - 1) * 7);

        await prisma.circleContribution.create({
          data: {
            circleAccount: { connect: { id: account.id } },
            userId: user.id,
            weekNumber: week,
            amount: weeklyAmt,
            type: "weekly",
          },
        });
      }
      console.log(`    Created 2 contribution records`);
    } else {
      accounts.push(existingAccount);
      console.log(`  Account exists in ${circle.name}`);
    }
  }

  // 5. Create defaults (mark one account as having defaults)
  console.log("\n▸ Creating defaults...");
  if (accounts[0]) {
    const existingDefaults = await prisma.circleDefault.findMany({
      where: { userId: user.id, status: "outstanding" },
    });

    if (existingDefaults.length === 0) {
      // Create 2 outstanding defaults
      for (let week = 3; week <= 4; week++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - (5 - week) * 7);

        await prisma.circleDefault.create({
          data: {
            circleAccountId: accounts[0].id,
            userId: user.id,
            weekNumber: week,
            amountDue: 250,
            clearanceAmount: 500,
            status: "outstanding",
          },
        });
      }
      console.log("  Created 2 outstanding defaults (₦500 clearance each)");

      // Update account to reflect defaults
      await prisma.circleAccount.update({
        where: { id: accounts[0].id },
        data: { weeksDefaulted: 2 },
      });
    } else {
      console.log(`  Defaults already exist (${existingDefaults.length})`);
    }
  }

  // 6. Create clearance records (completed payouts)
  console.log("\n▸ Creating clearance records...");
  if (accounts[1]) {
    const existingClearance = await prisma.circlePayoutRequest.findFirst({
      where: { userId: user.id, status: "disbursed" },
    });

    if (!existingClearance) {
      await prisma.circlePayoutRequest.create({
        data: {
          circleAccountId: accounts[1].id,
          userId: user.id,
          amount: 2500,
          status: "disbursed",
          clearedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          disbursedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          disbursementMethod: "manual",
          disbursementRef: "SEED-CLEARANCE-001",
        },
      });
      console.log("  Created 1 clearance record");
    } else {
      console.log("  Clearance records already exist");
    }
  }

  // 7. Create notifications (announcements)
  console.log("\n▸ Creating announcements...");
  const existingNotif = await prisma.notification.findFirst({
    where: { userId: user.id, type: "announcement" },
  });

  if (!existingNotif) {
    const announcements = [
      {
        title: "New Circle: Platinum Elite",
        body: "We're excited to announce our new Platinum Elite circle with 15% annual interest. Limited spots available!",
      },
      {
        title: "Maintenance Scheduled",
        body: "Platform maintenance scheduled for Saturday 2AM-4AM UTC. Services may be briefly unavailable.",
      },
      {
        title: "Referral Bonus Increased",
        body: "Earn up to ₦5,000 for every friend you refer. New tiered rewards now in effect!",
      },
    ];

    for (const ann of announcements) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "announcement",
          title: ann.title,
          body: ann.body,
          channel: "in_app",
          status: "unread",
        },
      });
    }
    console.log(`  Created ${announcements.length} announcements`);
  } else {
    console.log("  Announcements already exist");
  }

  // 8. Create marketplace listings
  console.log("\n▸ Creating marketplace listings...");
  const existingListing = await prisma.marketplaceListing.findFirst({
    where: { sellerId: user.id },
  });

  if (!existingListing) {
    const listings = [
      {
        title: "iPhone 14 Pro Max - Space Black",
        description: "Barely used iPhone 14 Pro Max, 256GB. Comes with original box and accessories. Battery health 98%.",
        price: 450000,
        category: "Electronics",
        condition: "Like New",
      },
      {
        title: "Samsung 55\" Smart TV",
        description: "4K UHD Smart TV with remote. Perfect for living room. Wall mount included.",
        price: 185000,
        category: "Electronics",
        condition: "Good",
      },
      {
        title: "Leather Office Chair",
        description: "Ergonomic leather office chair with lumbar support. Adjustable height and armrests.",
        price: 65000,
        category: "Furniture",
        condition: "Good",
      },
    ];

    for (const listing of listings) {
      await prisma.marketplaceListing.create({
        data: {
          sellerId: user.id,
          ...listing,
          currency: "NGN",
          status: "active",
        },
      });
    }
    console.log(`  Created ${listings.length} marketplace listings`);
  } else {
    console.log("  Marketplace listings already exist");
  }

  // 9. Create some transactions for history
  console.log("\n▸ Creating transaction history...");
  const txCount = await prisma.transaction.count({ where: { userId: user.id } });
  if (txCount < 5) {
    const txData = [
      { type: "contribution", amount: 250, description: "Bronze Circle - Week 1", status: "completed" },
      { type: "contribution", amount: 250, description: "Bronze Circle - Week 2", status: "completed" },
      { type: "contribution", amount: 250, description: "Silver Circle - Week 1", status: "completed" },
      { type: "contribution", amount: 250, description: "Silver Circle - Week 2", status: "completed" },
      { type: "wallet_funding", amount: 15000, description: "Wallet Funding via Bank Transfer", status: "completed" },
    ];

    for (const tx of txData) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          ...tx,
          reference: `SEED-TX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        },
      });
    }
    console.log(`  Created ${txData.length} transactions`);
  } else {
    console.log("  Sufficient transactions exist");
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Seed complete!");
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
