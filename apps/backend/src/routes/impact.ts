import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import {
  getActiveImpactNarratives,
  getImpactNarrativeById,
  createImpactNarrative,
  updateImpactNarrative,
  deleteImpactNarrative,
  getAllImpactNarrativesAdmin,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  createTimelineMilestone,
  updateTimelineMilestone,
  deleteTimelineMilestone,
} from "@thrift/db";

export const impactRouter = Router();

/* ---------------- Public Routes ---------------- */

impactRouter.get("/narratives", async (_req, res) => {
  try {
    const narratives = await getActiveImpactNarratives();
    res.json({ success: true, data: narratives });
  } catch (err) {
    console.error("Get impact narratives error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch impact narratives" });
  }
});

impactRouter.get("/narratives/:id", async (req, res) => {
  try {
    const narrative = await getImpactNarrativeById(req.params.id);
    if (!narrative) {
      res.status(404).json({ success: false, error: "Narrative not found" });
      return;
    }
    res.json({ success: true, data: narrative });
  } catch (err) {
    console.error("Get impact narrative error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch narrative" });
  }
});

/* ---------------- Admin Routes ---------------- */

impactRouter.get("/admin/narratives", requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = (req.query.search as string) || undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await getAllImpactNarrativesAdmin({ page, limit, search, isActive });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Admin impact narratives error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch impact narratives" });
  }
});

impactRouter.post("/admin/narratives", requireAdmin, async (req, res) => {
  try {
    const { name, age, country, countryCode, role, cohort, avatarUrl, coverImageUrl, headlineQuote, impactMetric, impactLabel, longFormNarrative, sortOrder, isActive, gallery, timeline } = req.body;

    if (!name || !headlineQuote || !longFormNarrative) {
      res.status(400).json({ success: false, error: "name, headlineQuote, and longFormNarrative are required" });
      return;
    }

    const narrative = await createImpactNarrative({
      name: name.trim(),
      age: Number(age),
      country: country.trim(),
      countryCode: countryCode.trim(),
      role: role.trim(),
      cohort: cohort.trim(),
      avatarUrl,
      coverImageUrl,
      headlineQuote: headlineQuote.trim(),
      impactMetric,
      impactLabel,
      longFormNarrative,
      sortOrder,
      isActive,
      gallery,
      timeline,
    });

    res.status(201).json({ success: true, data: narrative });
  } catch (err) {
    console.error("Create impact narrative error:", err);
    res.status(500).json({ success: false, error: "Failed to create impact narrative" });
  }
});

impactRouter.patch("/admin/narratives/:id", requireAdmin, async (req, res) => {
  try {
    const narrative = await updateImpactNarrative(req.params.id, req.body);
    res.json({ success: true, data: narrative });
  } catch (err) {
    console.error("Update impact narrative error:", err);
    res.status(500).json({ success: false, error: "Failed to update impact narrative" });
  }
});

impactRouter.delete("/admin/narratives/:id", requireAdmin, async (req, res) => {
  try {
    const narrative = await deleteImpactNarrative(req.params.id);
    res.json({ success: true, data: narrative });
  } catch (err) {
    console.error("Delete impact narrative error:", err);
    res.status(500).json({ success: false, error: "Failed to delete impact narrative" });
  }
});

/* Gallery Photos Admin */

impactRouter.post("/admin/narratives/:narrativeId/gallery", requireAdmin, async (req, res) => {
  try {
    const { url, caption, tag, sortOrder } = req.body;
    if (!url || !caption || !tag) {
      res.status(400).json({ success: false, error: "url, caption, and tag are required" });
      return;
    }
    const photo = await createGalleryPhoto(req.params.narrativeId, { url, caption, tag, sortOrder });
    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    console.error("Create gallery photo error:", err);
    res.status(500).json({ success: false, error: "Failed to create gallery photo" });
  }
});

impactRouter.patch("/admin/gallery/:id", requireAdmin, async (req, res) => {
  try {
    const photo = await updateGalleryPhoto(req.params.id, req.body);
    res.json({ success: true, data: photo });
  } catch (err) {
    console.error("Update gallery photo error:", err);
    res.status(500).json({ success: false, error: "Failed to update gallery photo" });
  }
});

impactRouter.delete("/admin/gallery/:id", requireAdmin, async (req, res) => {
  try {
    const photo = await deleteGalleryPhoto(req.params.id);
    res.json({ success: true, data: photo });
  } catch (err) {
    console.error("Delete gallery photo error:", err);
    res.status(500).json({ success: false, error: "Failed to delete gallery photo" });
  }
});

/* Timeline Milestones Admin */

impactRouter.post("/admin/narratives/:narrativeId/timeline", requireAdmin, async (req, res) => {
  try {
    const { year, title, description, tag, status, sortOrder } = req.body;
    if (!year || !title || !description) {
      res.status(400).json({ success: false, error: "year, title, and description are required" });
      return;
    }
    const milestone = await createTimelineMilestone(req.params.narrativeId, { year, title, description, tag, status, sortOrder });
    res.status(201).json({ success: true, data: milestone });
  } catch (err) {
    console.error("Create timeline milestone error:", err);
    res.status(500).json({ success: false, error: "Failed to create timeline milestone" });
  }
});

impactRouter.patch("/admin/timeline/:id", requireAdmin, async (req, res) => {
  try {
    const milestone = await updateTimelineMilestone(req.params.id, req.body);
    res.json({ success: true, data: milestone });
  } catch (err) {
    console.error("Update timeline milestone error:", err);
    res.status(500).json({ success: false, error: "Failed to update timeline milestone" });
  }
});

impactRouter.delete("/admin/timeline/:id", requireAdmin, async (req, res) => {
  try {
    const milestone = await deleteTimelineMilestone(req.params.id);
    res.json({ success: true, data: milestone });
  } catch (err) {
    console.error("Delete timeline milestone error:", err);
    res.status(500).json({ success: false, error: "Failed to delete timeline milestone" });
  }
});
