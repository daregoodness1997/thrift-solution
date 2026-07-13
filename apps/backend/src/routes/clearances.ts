import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getClearancesForUser, getClearanceStats } from "@thrift/db";

export const clearancesRouter = Router();

clearancesRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await getClearanceStats(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get clearances error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch clearances" });
  }
});

clearancesRouter.get("/list", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getClearancesForUser(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get clearances list error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch clearances" });
  }
});

clearancesRouter.post("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = await import("@thrift/db");

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      res.status(404).json({ success: false, error: "Clearance not found" });
      return;
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: "completed" },
    });

    res.json({ success: true, data: { message: "Clearance approved" } });
  } catch (err) {
    console.error("Approve clearance error:", err);
    res.status(500).json({ success: false, error: "Failed to approve clearance" });
  }
});
