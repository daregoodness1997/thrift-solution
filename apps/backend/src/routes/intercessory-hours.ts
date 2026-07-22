import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import {
  getActiveIntercessoryHours,
  getAllIntercessoryHoursAdmin,
  createIntercessoryHour,
  updateIntercessoryHour,
  deleteIntercessoryHour,
} from "@thrift/db";

export const intercessoryHoursRouter = Router();

intercessoryHoursRouter.get("/", async (_req, res) => {
  try {
    const hours = await getActiveIntercessoryHours();
    res.json({ success: true, data: hours });
  } catch (err) {
    console.error("Get intercessory hours error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch intercessory hours" });
  }
});

intercessoryHoursRouter.get("/admin", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await getAllIntercessoryHoursAdmin({ page, limit, search, isActive });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin intercessory hours error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch intercessory hours" });
  }
});

intercessoryHoursRouter.post("/admin", requireAdmin, async (req, res) => {
  try {
    const { name, timeUtc, joinLink, isActive, description } = req.body;

    if (!name || !timeUtc) {
      res.status(400).json({ success: false, error: "name and timeUtc are required" });
      return;
    }

    const hour = await createIntercessoryHour({
      name: name.trim(),
      timeUtc: timeUtc.trim(),
      joinLink: joinLink?.trim(),
      isActive,
      description: description?.trim(),
    });

    res.status(201).json({ success: true, data: hour });
  } catch (err) {
    console.error("Create intercessory hour error:", err);
    res.status(500).json({ success: false, error: "Failed to create intercessory hour" });
  }
});

intercessoryHoursRouter.patch("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const hour = await updateIntercessoryHour(req.params.id, req.body);
    res.json({ success: true, data: hour });
  } catch (err) {
    console.error("Update intercessory hour error:", err);
    res.status(500).json({ success: false, error: "Failed to update intercessory hour" });
  }
});

intercessoryHoursRouter.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const hour = await deleteIntercessoryHour(req.params.id);
    res.json({ success: true, data: hour });
  } catch (err) {
    console.error("Delete intercessory hour error:", err);
    res.status(500).json({ success: false, error: "Failed to delete intercessory hour" });
  }
});
