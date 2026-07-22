import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import {
  getActivePrayerRequests,
  createPrayerRequest,
  incrementPrayerCount,
  getAllPrayerRequestsAdmin,
  updatePrayerRequest,
  deletePrayerRequest,
  getPrayerRequestStats,
} from "@thrift/db";

export const prayerRouter = Router();

// Public routes
prayerRouter.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = (req.query.category as string) || undefined;

    const result = await getActivePrayerRequests({ page, limit, category });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get prayer requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch prayer requests" });
  }
});

prayerRouter.post("/", async (req, res) => {
  try {
    const { authorName, location, category, request } = req.body;

    if (!authorName || !category || !request) {
      res.status(400).json({ success: false, error: "authorName, category, and request are required" });
      return;
    }

    const prayer = await createPrayerRequest({
      authorName: authorName.trim(),
      location: location?.trim(),
      category: category.trim(),
      request: request.trim(),
    });

    res.status(201).json({ success: true, data: prayer });
  } catch (err) {
    console.error("Create prayer request error:", err);
    res.status(500).json({ success: false, error: "Failed to create prayer request" });
  }
});

prayerRouter.post("/:id/pray", async (req, res) => {
  try {
    const prayer = await incrementPrayerCount(req.params.id);
    res.json({ success: true, data: prayer });
  } catch (err) {
    console.error("Increment prayer count error:", err);
    res.status(500).json({ success: false, error: "Failed to record prayer" });
  }
});

// Admin routes
prayerRouter.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const stats = await getPrayerRequestStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Prayer request stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch prayer request stats" });
  }
});

prayerRouter.get("/admin", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await getAllPrayerRequestsAdmin({ page, limit, search, category, isActive });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin prayer requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch prayer requests" });
  }
});

prayerRouter.patch("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const { authorName, location, category, request, isActive } = req.body;

    const prayer = await updatePrayerRequest(req.params.id, {
      authorName,
      location,
      category,
      request,
      isActive,
    });

    res.json({ success: true, data: prayer });
  } catch (err) {
    console.error("Update prayer request error:", err);
    res.status(500).json({ success: false, error: "Failed to update prayer request" });
  }
});

prayerRouter.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const prayer = await deletePrayerRequest(req.params.id);
    res.json({ success: true, data: prayer });
  } catch (err) {
    console.error("Delete prayer request error:", err);
    res.status(500).json({ success: false, error: "Failed to delete prayer request" });
  }
});
