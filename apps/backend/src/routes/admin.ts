import { Router, Request } from "express";
import { requireAdmin } from "../middleware/auth";
import { getPaymentProvider, resolveVirtualAccount } from "../services/payments";
import { notifyUser } from "../services/notifications";
import {
  findUserById,
  getAdminStats,
  getUserGrowth,
  listUsers,
  getUserDetail,
  updateUserByAdmin,
  suspendUser,
  reactivateUser,
  getAuditLogs,
  createAuditLog,
  getAllTransactions,
  getTransactionStats,
  getAllReferralEarnings,
  payReferralEarning,
  getAllVirtualAccounts,
  getMembersWithoutVirtualAccount,
  getVirtualAccountsByUser,
  getWalletBalance,
  updateVirtualAccountStatus,
  createVirtualAccount,
  deleteVirtualAccountsByUser,
  hasVirtualAccount,
  isKycVerifiedForVirtualAccount,
  getAllMarketplaceListingsAdmin,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getAllJobListingsAdmin,
  updateJobListing,
  deleteJobListing,
  getAllDonationsAdmin,
  getDonationStatsAdmin,
  updateDonationStatus,
  prisma,
  createWhatsappGroup,
  creditWallet,
  updateVirtualAccountLastTransfer,
  getComprehensiveUserDetail,
  getUserDashboardOverview,
} from "@thrift/db";
import { circleInterestJob } from "../jobs/circleInterestJob";
import { circleContributionJob } from "../jobs/circleContributionJob";
import { virtualAccountGenerationJob } from "../jobs/virtualAccountJob";
import { paymentReversalReconciliationJob } from "../jobs/paymentReversalJob";

export const adminRouter = Router();

const VALID_ROLES = ["member", "support", "finance", "moderator", "admin", "superadmin"];
const VALID_TIERS = ["basic", "premium", "platinum"];

function actor(req: Request) {
  return {
    actorId: req.user?.userId ?? null,
    actorEmail: req.user?.email ?? null,
    ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
  };
}

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch admin stats" });
  }
});

adminRouter.get("/stats/user-growth", requireAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const data = await getUserGrowth(days);
    res.json({ success: true, data });
  } catch (err) {
    console.error("User growth error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user growth" });
  }
});

adminRouter.get("/users", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;
    const role = (req.query.role as string) || undefined;
    const status = (req.query.status as "active" | "suspended") || undefined;

    const result = await listUsers({ page, limit, search, role, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

adminRouter.get("/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await getUserDetail(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get user detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

adminRouter.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { name, role, accountTier } = req.body;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      res.status(400).json({ success: false, error: `Role must be one of: ${VALID_ROLES.join(", ")}` });
      return;
    }
    if (accountTier !== undefined && !VALID_TIERS.includes(accountTier)) {
      res.status(400).json({ success: false, error: `Tier must be one of: ${VALID_TIERS.join(", ")}` });
      return;
    }

    const updated = await updateUserByAdmin(req.params.id, { name, role, accountTier });
    await createAuditLog({
      ...actor(req),
      action: "user.update",
      entity: "user",
      entityId: req.params.id,
      metadata: { name, role, accountTier },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

adminRouter.post("/users/:id/suspend", requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ success: false, error: "You cannot suspend your own account" });
      return;
    }
    const user = await suspendUser(req.params.id);
    await createAuditLog({
      ...actor(req),
      action: "user.suspend",
      entity: "user",
      entityId: req.params.id,
      metadata: { reason: req.body?.reason ?? null },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ success: false, error: "Failed to suspend user" });
  }
});

adminRouter.post("/users/:id/reactivate", requireAdmin, async (req, res) => {
  try {
    const user = await reactivateUser(req.params.id);
    await createAuditLog({
      ...actor(req),
      action: "user.reactivate",
      entity: "user",
      entityId: req.params.id,
    });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Reactivate user error:", err);
    res.status(500).json({ success: false, error: "Failed to reactivate user" });
  }
});

adminRouter.get("/audit-logs", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const entity = (req.query.entity as string) || undefined;
    const action = (req.query.action as string) || undefined;
    const actorId = (req.query.actorId as string) || undefined;

    const result = await getAuditLogs({ page, limit, entity, action, actorId });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
  }
});

/* ---------------- Transactions ---------------- */

adminRouter.get("/transactions", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const type = (req.query.type as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await getAllTransactions({ page, limit, type, status, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin transactions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
});

adminRouter.get("/transactions/stats", requireAdmin, async (_req, res) => {
  try {
    const data = await getTransactionStats();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Transaction stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transaction stats" });
  }
});

adminRouter.get("/transactions/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        donation: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!transaction) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error("Admin transaction detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transaction" });
  }
});

adminRouter.get("/users/:id/comprehensive", requireAdmin, async (req, res) => {
  try {
    const user = await getComprehensiveUserDetail(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Get comprehensive user detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user details" });
  }
});

adminRouter.get("/users/:id/dashboard-overview", requireAdmin, async (req, res) => {
  try {
    const overview = await getUserDashboardOverview(req.params.id);
    if (!overview) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: overview });
  } catch (err) {
    console.error("Get user dashboard overview error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user overview" });
  }
});

/* ---------------- Referral earnings ---------------- */

adminRouter.get("/referrals", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as string) || undefined;

    const result = await getAllReferralEarnings({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin referrals error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch referral earnings" });
  }
});

adminRouter.post("/referrals/:id/pay", requireAdmin, async (req, res) => {
  try {
    const earning = await payReferralEarning(req.params.id);
    await createAuditLog({
      ...actor(req),
      action: "referral.pay",
      entity: "referralEarning",
      entityId: req.params.id,
      metadata: { amount: earning.amount, referrerId: earning.referrerId },
    });
    res.json({ success: true, data: earning });
  } catch (err) {
    console.error("Pay referral error:", err);
    res.status(400).json({ success: false, error: (err as Error).message || "Failed to pay referral" });
  }
});

/* ---------------- Virtual accounts ---------------- */

adminRouter.get("/virtual-accounts", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const provider = (req.query.provider as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await getAllVirtualAccounts({ page, limit, provider, status, search });
    const items = await Promise.all(
      result.items.map(async (va) => ({
        ...va,
        walletBalance: await getWalletBalance(va.userId),
      })),
    );
    res.json({ success: true, data: { ...result, items } });
  } catch (err) {
    console.error("Admin virtual accounts error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch virtual accounts" });
  }
});

adminRouter.post("/virtual-accounts/generate", requireAdmin, async (req, res) => {
  try {
    const forceProvider = (req.body?.provider as string) || null;
    const users = await getMembersWithoutVirtualAccount();

    let created = 0;
    let skipped = 0;
    const errors: { userId: string; email: string; error: string }[] = [];

    for (const u of users) {
      try {
        const verifiedName = u.verifiedName || "";
        const nameParts = (verifiedName || u.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || u.email.split("@")[0];
        const lastName = nameParts.slice(1).join(" ") || "User";

        if (!isKycVerifiedForVirtualAccount({ status: u.kycStatus || "", bvn: u.bvn, nin: u.nin })) {
          skipped++;
          errors.push({ userId: u.id, email: u.email, error: "User does not have both BVN and NIN verified" });
          continue;
        }

        if (await hasVirtualAccount(u.id)) {
          skipped++;
          errors.push({ userId: u.id, email: u.email, error: "User already has a virtual account" });
          continue;
        }

        const provider = forceProvider || "flutterwave";
        const paymentProvider = getPaymentProvider(provider);
        if (!paymentProvider.createVirtualAccount) {
          throw new Error(`${provider} does not support virtual account creation`);
        }

        const reference = `va_${u.id}_${provider}`;
        const result = await paymentProvider.createVirtualAccount({
          email: u.email,
          firstName,
          lastName,
          phone: u.phone || undefined,
          bvn: u.bvn || undefined,
          nin: u.nin || undefined,
          reference,
          narration: "Thrift Solution Virtual Account",
        });
        const resolved = resolveVirtualAccount(result, u.id);

        await createVirtualAccount({
          userId: u.id,
          provider,
          accountNumber: resolved.accountNumber,
          bankName: resolved.bankName,
          bankCode: resolved.bankCode,
          currency: "NGN",
          reference: result.reference,
          providerRef: result.providerRef,
          isPermanent: true,
          bvn: u.bvn || undefined,
          nin: u.nin || undefined,
          accountName: verifiedName || undefined,
        });
        created++;
      } catch (err) {
        skipped++;
        errors.push({ userId: u.id, email: u.email, error: err instanceof Error ? err.message : "Failed" });
      }
    }

    await createAuditLog({
      ...actor(req),
      action: "virtualAccount.backfill",
      entity: "virtualAccount",
      entityId: "bulk",
      metadata: { forceProvider, created, skipped },
    });

    res.json({ success: true, data: { created, skipped, total: users.length, errors } });
  } catch (err) {
    console.error("Backfill virtual accounts error:", err);
    res.status(500).json({ success: false, error: "Failed to generate virtual accounts" });
  }
});

adminRouter.patch("/virtual-accounts/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status is required" });
      return;
    }
    const account = await updateVirtualAccountStatus(req.params.id, status);
    await createAuditLog({
      ...actor(req),
      action: "virtualAccount.updateStatus",
      entity: "virtualAccount",
      entityId: req.params.id,
      metadata: { status },
    });
    res.json({ success: true, data: account });
  } catch (err) {
    console.error("Update virtual account error:", err);
    res.status(500).json({ success: false, error: "Failed to update virtual account" });
  }
});

const VALID_VA_PROVIDERS = ["flutterwave", "paystack", "nomba"];

adminRouter.post("/virtual-accounts/:userId/regenerate", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { provider, reason } = req.body;

    if (!provider || !VALID_VA_PROVIDERS.includes(provider)) {
      res.status(400).json({ success: false, error: `provider must be one of: ${VALID_VA_PROVIDERS.join(", ")}` });
      return;
    }
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      res.status(400).json({ success: false, error: "reason is required" });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const kyc = await prisma.kyc.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!isKycVerifiedForVirtualAccount({ status: kyc?.status || "", bvn: user.bvn, nin: user.nin })) {
      res.status(400).json({ success: false, error: "User does not have both BVN and NIN verified" });
      return;
    }

    const nameParts = (kyc?.verifiedName || user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || user.email.split("@")[0];
    const lastName = nameParts.slice(1).join(" ") || "User";

    const existingAccounts = await getVirtualAccountsByUser(userId);
    const oldAccountNumber = existingAccounts[0]?.accountNumber || null;

    const deletedCount = await deleteVirtualAccountsByUser(userId);

    const reference = `va_${userId}_${provider}_${Date.now()}`;
    const paymentProvider = getPaymentProvider(provider);
    if (!paymentProvider.createVirtualAccount) {
      res.status(400).json({ success: false, error: `${provider} does not support virtual account creation` });
      return;
    }

    const result = await paymentProvider.createVirtualAccount({
      email: user.email,
      firstName,
      lastName,
      phone: user.phone || undefined,
      bvn: user.bvn || undefined,
      nin: user.nin || undefined,
      reference,
      narration: "Thrift Solution Virtual Account",
    });
    const resolved = resolveVirtualAccount(result, userId);

    const newVa = await createVirtualAccount({
      userId,
      provider,
      accountNumber: resolved.accountNumber,
      bankName: resolved.bankName,
      bankCode: resolved.bankCode,
      currency: "NGN",
      reference: result.reference,
      providerRef: result.providerRef,
      isPermanent: true,
      bvn: user.bvn || undefined,
      nin: user.nin || undefined,
      accountName: kyc?.verifiedName || undefined,
    });

    await createAuditLog({
      ...actor(req),
      action: "virtualAccount.regenerate",
      entity: "virtualAccount",
      entityId: newVa.id,
      metadata: {
        provider,
        reason: reason.trim(),
        oldAccountNumber,
        newAccountNumber: resolved.accountNumber,
        targetUserId: userId,
        deletedCount,
      },
    });

    await notifyUser(userId, {
      type: "virtual_account.regenerated",
      title: "Your Virtual Account Has Been Updated",
      body: `Your virtual account has been regenerated by an administrator. Your new account number is ${resolved.accountNumber} (${resolved.bankName}).`,
      email: {
        heading: "Your Virtual Account Has Been Updated",
        html: `<p>Your virtual account has been regenerated by an administrator.</p>
               <p><strong>New Account Number:</strong> ${resolved.accountNumber}</p>
               <p><strong>Bank:</strong> ${resolved.bankName}</p>
               <p><strong>Provider:</strong> ${provider}</p>
               <p>Please update your records with the new account details.</p>`,
        text: `Your virtual account has been regenerated. New account: ${resolved.accountNumber} (${resolved.bankName}, ${provider}).`,
        cta: { label: "View Account", url: `${process.env.DASHBOARD_URL || "http://localhost:3001"}/wallet` },
      },
    });

    res.json({ success: true, data: newVa });
  } catch (err) {
    console.error("Regenerate virtual account error:", err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to regenerate virtual account" });
  }
});

adminRouter.post("/virtual-accounts/reconcile-all", requireAdmin, async (req, res) => {
  try {
    const { sinceHours = 24 } = req.body;

    const allAccounts = await getAllVirtualAccounts({ page: 1, limit: 10000, status: "active" });
    const accounts = allAccounts.items || [];

    let totalFound = 0;
    let totalCredited = 0;
    const results: Array<{ userId: string; accountNumber: string; provider: string; found: number; credited: number }> = [];

    for (const va of accounts) {
      const paymentProvider = getPaymentProvider(va.provider);
      if (!paymentProvider || !paymentProvider.checkVirtualAccountTransfers) {
        continue;
      }

      try {
        const recentTransfers = await paymentProvider.checkVirtualAccountTransfers(
          va.accountNumber,
          sinceHours
        );

        let creditedCount = 0;
        for (const transfer of recentTransfers) {
          const reference = transfer.reference;
          const description = `Wallet funding via ${va.provider} virtual account ${va.accountNumber} (admin reconciliation)`;

          try {
            await creditWallet(va.userId, transfer.amount, "wallet_funding", description, reference);
            await updateVirtualAccountLastTransfer(va.id);
            creditedCount++;
          } catch (err) {
            const isDuplicate = typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
            if (!isDuplicate) {
              console.error("Error crediting wallet for transfer:", transfer.reference, err);
            }
          }
        }

        totalFound += recentTransfers.length;
        totalCredited += creditedCount;
        results.push({
          userId: va.userId,
          accountNumber: va.accountNumber,
          provider: va.provider,
          found: recentTransfers.length,
          credited: creditedCount,
        });
      } catch (err) {
        console.error(`Error reconciling account ${va.accountNumber}:`, err);
      }
    }

    await createAuditLog({
      ...actor(req),
      action: "virtualAccount.reconcileAll",
      entity: "virtualAccount",
      metadata: {
        sinceHours,
        accountsProcessed: accounts.length,
        totalFound,
        totalCredited,
      },
    });

    res.json({
      success: true,
      data: {
        accountsProcessed: accounts.length,
        totalTransfersFound: totalFound,
        totalTransfersCredited: totalCredited,
        results,
      },
    });
  } catch (err) {
    console.error("Admin virtual account reconciliation error:", err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to reconcile payments" });
  }
});

/* ---------------- Marketplace moderation ---------------- */

adminRouter.get("/marketplace", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await getAllMarketplaceListingsAdmin({ page, limit, status, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin marketplace error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch marketplace listings" });
  }
});

adminRouter.patch("/marketplace/:id", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status is required" });
      return;
    }
    const listing = await updateMarketplaceListing(req.params.id, { status });
    await createAuditLog({
      ...actor(req),
      action: "marketplace.updateStatus",
      entity: "marketplaceListing",
      entityId: req.params.id,
      metadata: { status },
    });
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Moderate marketplace error:", err);
    res.status(500).json({ success: false, error: "Failed to update listing" });
  }
});

adminRouter.delete("/marketplace/:id", requireAdmin, async (req, res) => {
  try {
    const listing = await deleteMarketplaceListing(req.params.id);
    await createAuditLog({
      ...actor(req),
      action: "marketplace.remove",
      entity: "marketplaceListing",
      entityId: req.params.id,
    });
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Remove marketplace error:", err);
    res.status(500).json({ success: false, error: "Failed to remove listing" });
  }
});

/* ---------------- Jobs moderation ---------------- */

adminRouter.get("/jobs", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await getAllJobListingsAdmin({ page, limit, status, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin jobs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch job listings" });
  }
});

adminRouter.patch("/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status is required" });
      return;
    }
    const listing = await updateJobListing(req.params.id, { status });
    await createAuditLog({
      ...actor(req),
      action: "jobs.updateStatus",
      entity: "jobListing",
      entityId: req.params.id,
      metadata: { status },
    });
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Moderate jobs error:", err);
    res.status(500).json({ success: false, error: "Failed to update job" });
  }
});

adminRouter.delete("/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const listing = await deleteJobListing(req.params.id);
    await createAuditLog({
      ...actor(req),
      action: "jobs.remove",
      entity: "jobListing",
      entityId: req.params.id,
    });
    res.json({ success: true, data: listing });
  } catch (err) {
    console.error("Remove jobs error:", err);
    res.status(500).json({ success: false, error: "Failed to remove job" });
  }
});

/* ---------------- Donations oversight ---------------- */

adminRouter.get("/donations", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const type = (req.query.type as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await getAllDonationsAdmin({ page, limit, type, status, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin donations error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch donations" });
  }
});

adminRouter.get("/donations/stats", requireAdmin, async (_req, res) => {
  try {
    const data = await getDonationStatsAdmin();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Donation stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch donation stats" });
  }
});

adminRouter.patch("/donations/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status is required" });
      return;
    }
    const donation = await updateDonationStatus(req.params.id, status);
    await createAuditLog({
      ...actor(req),
      action: "donation.updateStatus",
      entity: "donation",
      entityId: req.params.id,
      metadata: { status },
    });
    res.json({ success: true, data: donation });
  } catch (err) {
    console.error("Update donation error:", err);
    res.status(500).json({ success: false, error: "Failed to update donation" });
  }
});

// WhatsApp Groups Admin CRUD
adminRouter.get("/whatsapp-groups", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = (req.query.search as string) || undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { circleName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.whatsappGroup.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.whatsappGroup.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Admin whatsapp groups error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch WhatsApp groups" });
  }
});

adminRouter.post("/whatsapp-groups", requireAdmin, async (req, res) => {
  try {
    const { name, description, circleName, inviteLink } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: "Group name is required" });
      return;
    }
    const group = await createWhatsappGroup({ name, description, circleName, inviteLink });
    await createAuditLog({
      ...actor(req),
      action: "whatsappGroup.create",
      entity: "whatsappGroup",
      entityId: group.id,
      metadata: { name, circleName },
    });
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error("Admin create whatsapp group error:", err);
    res.status(500).json({ success: false, error: "Failed to create WhatsApp group" });
  }
});

adminRouter.patch("/whatsapp-groups/:id", requireAdmin, async (req, res) => {
  try {
    const { name, description, circleName, inviteLink, pinned } = req.body;
    const group = await prisma.whatsappGroup.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(circleName !== undefined && { circleName }),
        ...(inviteLink !== undefined && { inviteLink }),
        ...(pinned !== undefined && { pinned }),
      },
    });
    await createAuditLog({
      ...actor(req),
      action: "whatsappGroup.update",
      entity: "whatsappGroup",
      entityId: group.id,
      metadata: { name, circleName, pinned },
    });
    res.json({ success: true, data: group });
  } catch (err) {
    console.error("Admin update whatsapp group error:", err);
    res.status(500).json({ success: false, error: "Failed to update WhatsApp group" });
  }
});

adminRouter.delete("/whatsapp-groups/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.whatsappGroup.delete({
      where: { id: req.params.id },
    });
    await createAuditLog({
      ...actor(req),
      action: "whatsappGroup.delete",
      entity: "whatsappGroup",
      entityId: req.params.id,
    });
    res.json({ success: true, data: { message: "Group deleted" } });
  } catch (err) {
    console.error("Admin delete whatsapp group error:", err);
    res.status(500).json({ success: false, error: "Failed to delete WhatsApp group" });
  }
});

/* ---------------- Cron job manual triggers ---------------- */

const CRON_JOBS: Record<string, { fn: () => Promise<unknown>; label: string }> = {
  circleInterest: { fn: circleInterestJob, label: "Circle Interest Calculation" },
  circleContribution: { fn: circleContributionJob, label: "Circle Contribution Debit" },
  virtualAccount: { fn: virtualAccountGenerationJob, label: "Virtual Account Generation" },
  paymentReversal: { fn: paymentReversalReconciliationJob, label: "Payment Reversal Reconciliation" },
};

const runningJobs = new Set<string>();

adminRouter.get("/cron-jobs", requireAdmin, (_req, res) => {
  const jobs = Object.entries(CRON_JOBS).map(([key, { label }]) => ({
    id: key,
    label,
    running: runningJobs.has(key),
  }));
  res.json({ success: true, data: jobs });
});

adminRouter.post("/cron-jobs/:jobId/trigger", requireAdmin, async (req, res) => {
  const { jobId } = req.params;
  const job = CRON_JOBS[jobId];

  if (!job) {
    res.status(404).json({ success: false, error: `Unknown job: ${jobId}` });
    return;
  }

  if (runningJobs.has(jobId)) {
    res.status(409).json({ success: false, error: `${job.label} is already running` });
    return;
  }

  runningJobs.add(jobId);

  const startTime = Date.now();
  try {
    const result = await job.fn();
    const elapsed = Date.now() - startTime;

    await createAuditLog({
      ...actor(req),
      action: "cronJob.trigger",
      entity: "cronJob",
      entityId: jobId,
      metadata: { jobId, label: job.label, elapsedMs: elapsed, result },
    });

    res.json({ success: true, data: { jobId, label: job.label, elapsedMs: elapsed, result } });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";

    await createAuditLog({
      ...actor(req),
      action: "cronJob.trigger.error",
      entity: "cronJob",
      entityId: jobId,
      metadata: { jobId, label: job.label, elapsedMs: elapsed, error: message },
    });

    res.status(500).json({ success: false, error: `${job.label} failed: ${message}` });
  } finally {
    runningJobs.delete(jobId);
  }
});
