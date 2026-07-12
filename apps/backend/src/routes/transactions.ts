import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUserTransactionsFiltered, getUserTransactions } from "@thrift/db";
import { prisma } from "@thrift/db";

export const transactionsRouter = Router();

transactionsRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const type = req.query.type as string | undefined;

    let result;
    if (type && type !== "all") {
      result = await getUserTransactionsFiltered(userId, { limit, offset, type });
    } else {
      result = await getUserTransactions(userId, { limit, offset });
    }

    const totalPages = Math.ceil(result.total / limit);

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
});

transactionsRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        donation: true,
      },
    });

    if (!transaction || transaction.userId !== userId) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error("Get transaction detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transaction" });
  }
});
