import { Router, Request } from "express";
import { requireAdmin } from "../middleware/auth";
import { getConfig, saveConfig, createAuditLog } from "@thrift/db";

export const configRouter = Router();

configRouter.get("/", async (_req, res) => {
  try {
    const data = await getConfig();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load config" });
  }
});

configRouter.post("/", requireAdmin, async (req: Request, res) => {
  try {
    await saveConfig(req.body);
    await createAuditLog({
      actorId: req.user?.userId ?? null,
      actorEmail: req.user?.email ?? null,
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
      action: "config.update",
      entity: "config",
      entityId: "default",
      metadata: { keys: Object.keys(req.body ?? {}) },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save config" });
  }
});
