import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth";
import { findUserById, setTransactionPin } from "@thrift/db";

export const pinRouter = Router();

pinRouter.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: { hasPin: !!user.transactionPinHash } });
  } catch (err) {
    console.error("Get PIN status error:", err);
    res.status(500).json({ success: false, error: "Failed to check PIN status" });
  }
});

pinRouter.post("/set", authMiddleware, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!newPin || !/^\d{4,6}$/.test(String(newPin))) {
      res.status(400).json({ success: false, error: "PIN must be 4-6 digits" });
      return;
    }

    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (user.transactionPinHash) {
      if (!currentPin) {
        res.status(400).json({ success: false, error: "Current PIN is required to change PIN" });
        return;
      }
      const valid = await bcrypt.compare(String(currentPin), user.transactionPinHash);
      if (!valid) {
        res.status(400).json({ success: false, error: "Current PIN is incorrect" });
        return;
      }
    }

    const pinHash = await bcrypt.hash(String(newPin), 10);
    await setTransactionPin(req.user!.userId, pinHash);

    res.json({ success: true, message: "Transaction PIN set successfully" });
  } catch (err) {
    console.error("Set PIN error:", err);
    res.status(500).json({ success: false, error: "Failed to set PIN" });
  }
});

pinRouter.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      res.status(400).json({ success: false, error: "PIN must be 4-6 digits" });
      return;
    }

    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (!user.transactionPinHash) {
      res.status(400).json({ success: false, error: "No transaction PIN set. Please set one first." });
      return;
    }

    const valid = await bcrypt.compare(String(pin), user.transactionPinHash);
    if (!valid) {
      res.status(400).json({ success: false, error: "Incorrect PIN" });
      return;
    }

    res.json({ success: true, message: "PIN verified" });
  } catch (err) {
    console.error("Verify PIN error:", err);
    res.status(500).json({ success: false, error: "Failed to verify PIN" });
  }
});
