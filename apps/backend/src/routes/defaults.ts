import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getDefaultsForUser } from "@thrift/db";

export const defaultsRouter = Router();

defaultsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const defaults = await getDefaultsForUser(req.user!.userId);
    res.json({ success: true, data: defaults });
  } catch (err) {
    console.error("Get defaults error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch defaults" });
  }
});

defaultsRouter.post("/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = await import("@thrift/db");

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      res.status(404).json({ success: false, error: "Default not found" });
      return;
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: "completed" },
    });

    res.json({ success: true, data: { message: "Default resolved" } });
  } catch (err) {
    console.error("Resolve default error:", err);
    res.status(500).json({ success: false, error: "Failed to resolve default" });
  }
});
