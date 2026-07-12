import { Router } from "express";
import { getConfig, saveConfig } from "@thrift/db";

export const configRouter = Router();

configRouter.get("/", async (_req, res) => {
  try {
    const data = await getConfig();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load config" });
  }
});

configRouter.post("/", async (req, res) => {
  try {
    await saveConfig(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save config" });
  }
});
