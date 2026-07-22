import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import {
  getLiveSession,
  getUpcomingSessions,
  getAllPrayerSessionsAdmin,
  createPrayerSession,
  updatePrayerSession,
  deletePrayerSession,
  getPrayerSessionStats,
} from "@thrift/db";

export const prayerSessionsRouter = Router();

prayerSessionsRouter.get("/live", async (_req, res) => {
  try {
    const session = await getLiveSession();
    res.json({ success: true, data: session });
  } catch (err) {
    console.error("Get live session error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch live session" });
  }
});

prayerSessionsRouter.get("/upcoming", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const sessions = await getUpcomingSessions({ limit });
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error("Get upcoming sessions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch upcoming sessions" });
  }
});

prayerSessionsRouter.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const stats = await getPrayerSessionStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Prayer session stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

prayerSessionsRouter.get("/admin", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;
    const isLive = req.query.isLive !== undefined ? req.query.isLive === "true" : undefined;

    const result = await getAllPrayerSessionsAdmin({ page, limit, search, isLive });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin prayer sessions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch sessions" });
  }
});

prayerSessionsRouter.post("/admin", requireAdmin, async (req, res) => {
  try {
    const { title, description, streamUrl, startTime, endTime, isLive, isRecurring, recurrence, joinLink } = req.body;

    if (!title || !startTime) {
      res.status(400).json({ success: false, error: "title and startTime are required" });
      return;
    }

    const session = await createPrayerSession({
      title: title.trim(),
      description: description?.trim(),
      streamUrl: streamUrl?.trim(),
      startTime,
      endTime: endTime?.trim(),
      isLive,
      isRecurring,
      recurrence: recurrence?.trim(),
      joinLink: joinLink?.trim(),
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error("Create prayer session error:", err);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

prayerSessionsRouter.patch("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const session = await updatePrayerSession(req.params.id, req.body);
    res.json({ success: true, data: session });
  } catch (err) {
    console.error("Update prayer session error:", err);
    res.status(500).json({ success: false, error: "Failed to update session" });
  }
});

prayerSessionsRouter.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const session = await deletePrayerSession(req.params.id);
    res.json({ success: true, data: session });
  } catch (err) {
    console.error("Delete prayer session error:", err);
    res.status(500).json({ success: false, error: "Failed to delete session" });
  }
});
