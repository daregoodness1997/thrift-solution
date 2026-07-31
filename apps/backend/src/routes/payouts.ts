import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createWalletPayoutRequest,
  getWalletPayoutRequestsByUser,
  cancelWalletPayoutRequest,
} from "@thrift/db";

export const payoutsRouter = Router();

payoutsRouter.post("/requests", authMiddleware, async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (amount == null) {
      res.status(400).json({ success: false, error: "amount is required" });
      return;
    }
    const request = await createWalletPayoutRequest(req.user!.userId, Number(amount), note);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payout request";
    console.error("Create payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});

payoutsRouter.get("/requests", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || undefined;

    const result = await getWalletPayoutRequestsByUser(req.user!.userId, { page, limit, status });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get my payout requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch payout requests" });
  }
});

payoutsRouter.post("/requests/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const request = await cancelWalletPayoutRequest(req.params.id, req.user!.userId);
    res.json({ success: true, data: request });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel payout request";
    console.error("Cancel payout request error:", err);
    res.status(400).json({ success: false, error: message });
  }
});
