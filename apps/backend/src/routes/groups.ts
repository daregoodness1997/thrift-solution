import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getGroups, findGroupById, createGroup } from "@thrift/db";

export const groupsRouter = Router();

// List all active groups
groupsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const groups = await getGroups({ limit, offset });
    res.json({ success: true, data: groups });
  } catch (err) {
    console.error("Get groups error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch groups" });
  }
});

// Get single group with members
groupsRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const group = await findGroupById(req.params.id);
    if (!group) {
      res.status(404).json({ success: false, error: "Group not found" });
      return;
    }

    res.json({ success: true, data: group });
  } catch (err) {
    console.error("Get group error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch group" });
  }
});

// Create a new group
groupsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, targetAmount, cycleFrequency } = req.body;

    if (!name || !targetAmount || !cycleFrequency) {
      res.status(400).json({ success: false, error: "Name, target amount, and cycle frequency are required" });
      return;
    }

    const group = await createGroup({
      name,
      description: description || undefined,
      targetAmount: parseFloat(targetAmount),
      cycleFrequency,
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ success: false, error: "Failed to create group" });
  }
});
