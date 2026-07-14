import { Router, Request } from "express";
import { requireAdmin } from "../middleware/auth";
import { getPaymentProvider, resolveVirtualAccount } from "../services/payments";
import {
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
  updateVirtualAccountStatus,
  createVirtualAccount,
  getAllMarketplaceListingsAdmin,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getAllJobListingsAdmin,
  updateJobListing,
  deleteJobListing,
  getAllDonationsAdmin,
  getDonationStatsAdmin,
  updateDonationStatus,
} from "@thrift/db";

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
    res.json({ success: true, data: result });
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
        const nameParts = (u.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || u.email.split("@")[0];
        const lastName = nameParts.slice(1).join(" ") || "User";

        const provider = forceProvider || (u.bvn ? "flutterwave" : "paystack");
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
