import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserTransactionsFiltered, getUserTransactions } from "@thrift/db";

export const transactionsRouter = Router();

transactionsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;

    let transactions;
    if (type && type !== "all") {
      transactions = await getUserTransactionsFiltered(userId, { limit, offset, type });
    } else {
      transactions = await getUserTransactions(userId, { limit, offset });
    }

    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
});
