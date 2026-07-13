import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getWhatsappGroups,
  getAllWhatsappGroups,
  createWhatsappGroup,
  joinWhatsappGroup,
  seedDefaultWhatsappGroups,
} from "@thrift/db";

export const whatsappRouter = Router();

whatsappRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    await seedDefaultWhatsappGroups();
    const result = await getWhatsappGroups(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get WhatsApp groups error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch WhatsApp groups" });
  }
});

whatsappRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    await seedDefaultWhatsappGroups();
    const result = await getAllWhatsappGroups({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get all WhatsApp groups error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch WhatsApp groups" });
  }
});

whatsappRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, circleName, inviteLink } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: "Group name is required" });
      return;
    }
    const group = await createWhatsappGroup({ name, description, circleName, inviteLink });
    await joinWhatsappGroup(group.id, req.user!.userId);
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error("Create WhatsApp group error:", err);
    res.status(500).json({ success: false, error: "Failed to create WhatsApp group" });
  }
});

whatsappRouter.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    await joinWhatsappGroup(req.params.id, req.user!.userId);
    res.json({ success: true, data: { message: "Joined group successfully" } });
  } catch (err) {
    console.error("Join WhatsApp group error:", err);
    res.status(500).json({ success: false, error: "Failed to join group" });
  }
});
