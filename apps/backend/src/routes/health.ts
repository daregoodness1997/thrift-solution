import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.post("/wake", (_req, res) => {
  res.json({ status: "awake", message: "Service is running", timestamp: new Date().toISOString() });
});
