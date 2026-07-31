import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { getAllCircleDefaults, markDefaultAsCleared } from "@thrift/db";

export const defaultsRouter = Router();

defaultsRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await getAllCircleDefaults({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get defaults error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch defaults" });
  }
});

defaultsRouter.post("/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { proofUrl, note } = req.body;
    const record = await markDefaultAsCleared(id, req.user!.userId, { proofUrl, note });
    res.json({ success: true, data: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve default";
    console.error("Resolve default error:", err);
    res.status(400).json({ success: false, error: message });
  }
});
