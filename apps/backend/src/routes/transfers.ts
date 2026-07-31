import { Router } from "express";
import bcrypt from "bcryptjs";
import nodeCrypto from "node:crypto";
import { authMiddleware } from "../middleware/auth";
import { issueOtp, verifyOtp } from "../services/auth/otp";
import { resolveAccountNumber } from "../services/payments";
import {
  findUserById,
  findUserByThrAccountNumber,
  getWalletBalance,
  debitWalletPending,
  confirmTransaction,
  reverseTransaction,
  creditWallet,
  createTransfer,
  updateTransferStatus,
  findTransferByReference,
  findTransferById,
  getUserTransfers,
  prisma,
} from "@thrift/db";

export const transfersRouter = Router();

const OTP_TTL_MS = 10 * 60 * 1000;

transfersRouter.post("/preview", authMiddleware, async (req, res) => {
  try {
    const { recipientType, accountNumber, bankCode } = req.body;
    const userId = req.user!.userId;

    if (!recipientType || !["member", "bank"].includes(recipientType)) {
      res.status(400).json({ success: false, error: "Recipient type must be 'member' or 'bank'" });
      return;
    }

    if (recipientType === "bank") {
      res.status(400).json({
        success: false,
        error: "Bank transfers are no longer self-served. Request a payout from your wallet instead.",
      });
      return;
    }

    if (recipientType === "member") {
      if (!accountNumber) {
        res.status(400).json({ success: false, error: "THR account number is required" });
        return;
      }
      const recipient = await findUserByThrAccountNumber(String(accountNumber).trim());
      if (!recipient) {
        res.status(404).json({ success: false, error: "Member not found" });
        return;
      }
      if (recipient.id === userId) {
        res.status(400).json({ success: false, error: "Cannot transfer to yourself" });
        return;
      }
      res.json({
        success: true,
        data: {
          recipientType: "member",
          recipientName: recipient.name,
          recipientAccount: recipient.accountNumber,
          fee: 0,
        },
      });
      return;
    }

    res.status(400).json({ success: false, error: "Invalid recipient type" });
  } catch (err) {
    console.error("Transfer preview error:", err);
    res.status(500).json({ success: false, error: "Failed to preview transfer" });
  }
});

transfersRouter.post("/initiate", authMiddleware, async (req, res) => {
  try {
    const { pin, amount, recipientType, accountNumber, bankCode, description } = req.body;
    const userId = req.user!.userId;

    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      res.status(400).json({ success: false, error: "PIN must be 4-6 digits" });
      return;
    }
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: "Amount must be greater than 0" });
      return;
    }
    if (!recipientType || !["member", "bank"].includes(recipientType)) {
      res.status(400).json({ success: false, error: "Recipient type must be 'member' or 'bank'" });
      return;
    }

    if (recipientType === "bank") {
      res.status(400).json({
        success: false,
        error: "Bank transfers are no longer self-served. Request a payout from your wallet instead.",
      });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (!user.transactionPinHash) {
      res.status(400).json({ success: false, error: "Please set a transaction PIN first in Settings" });
      return;
    }

    const pinValid = await bcrypt.compare(String(pin), user.transactionPinHash);
    if (!pinValid) {
      res.status(400).json({ success: false, error: "Incorrect PIN" });
      return;
    }

    const balance = await getWalletBalance(userId);
    if (balance < amount) {
      res.status(400).json({ success: false, error: "Insufficient wallet balance" });
      return;
    }

    let recipientName = "";
    let recipientUserId: string | undefined;
    let recipientBankName: string | undefined;
    let recipientAccountNumber: string | undefined;

    if (recipientType === "member") {
      if (!accountNumber) {
        res.status(400).json({ success: false, error: "THR account number is required" });
        return;
      }
      const recipient = await findUserByThrAccountNumber(String(accountNumber).trim());
      if (!recipient) {
        res.status(404).json({ success: false, error: "Member not found" });
        return;
      }
      if (recipient.id === userId) {
        res.status(400).json({ success: false, error: "Cannot transfer to yourself" });
        return;
      }
      recipientName = recipient.name;
      recipientUserId = recipient.id;
      recipientAccountNumber = recipient.accountNumber;
    }

    const reference = `TXF-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;

    const transfer = await createTransfer({
      senderId: userId,
      recipientType,
      recipientUserId,
      recipientName,
      recipientBank: recipientBankName,
      recipientAccount: recipientAccountNumber,
      amount: parseFloat(amount),
      reference,
      description,
    });

    await debitWalletPending(userId, parseFloat(amount), description || `Transfer to ${recipientName}`, reference);

    const otpChannel = user.phoneVerified && user.phone ? "sms" : "email";
    const destination = otpChannel === "sms" ? user.phone! : user.email;

    await issueOtp({
      userId,
      type: "transfer",
      channel: otpChannel,
      destination,
      title: "Transfer Verification Code",
      actionLabel: "confirm your wallet transfer",
      ttlMs: OTP_TTL_MS,
    });

    res.status(201).json({
      success: true,
      data: {
        transferId: transfer.id,
        reference,
        recipientName,
        recipientAccount: recipientAccountNumber,
        recipientBank: recipientBankName,
        recipientType,
        amount: parseFloat(amount),
      },
    });
  } catch (err) {
    console.error("Initiate transfer error:", err);
    res.status(500).json({ success: false, error: "Failed to initiate transfer" });
  }
});

transfersRouter.post("/confirm", authMiddleware, async (req, res) => {
  try {
    const { reference, otp } = req.body;
    const userId = req.user!.userId;

    if (!reference || !otp) {
      res.status(400).json({ success: false, error: "Reference and OTP are required" });
      return;
    }

    const otpValid = await verifyOtp(userId, "transfer", otp);
    if (!otpValid) {
      res.status(400).json({ success: false, error: "Invalid or expired OTP" });
      return;
    }

    const transfer = await findTransferByReference(reference);
    if (!transfer || transfer.senderId !== userId) {
      res.status(404).json({ success: false, error: "Transfer not found" });
      return;
    }

    if (transfer.status !== "pending") {
      res.status(400).json({ success: false, error: `Transfer already ${transfer.status}` });
      return;
    }

    const debitTx = await findTransferByReference(reference);
    await updateTransferStatus(transfer.id, "processing");

    try {
      if (transfer.recipientType === "member" && transfer.recipientUserId) {
        await creditWallet(
          transfer.recipientUserId,
          Number(transfer.amount),
          "wallet_transfer_received",
          `Transfer from member`,
          reference,
        );
        await updateTransferStatus(transfer.id, "completed");
      } else {
        await updateTransferStatus(transfer.id, "failed");
        res.status(400).json({
          success: false,
          error: "Bank transfers are no longer supported. Request a payout from your wallet instead.",
        });
        return;
      }

      const pendingDebit = await prisma.transaction.findFirst({
        where: { userId, reference, status: "pending" },
      });
      if (pendingDebit) {
        await confirmTransaction(pendingDebit.id);
      }

      res.json({ success: true, message: "Transfer completed successfully" });
    } catch (err) {
      await updateTransferStatus(transfer.id, "failed");
      const pendingDebit = await prisma.transaction.findFirst({
        where: { userId, reference, status: "pending" },
      });
      if (pendingDebit) {
        await reverseTransaction(pendingDebit.id);
      }
      console.error("Transfer execution error:", err);
      res.status(500).json({ success: false, error: "Transfer failed. Funds have been returned to your wallet." });
    }
  } catch (err) {
    console.error("Confirm transfer error:", err);
    res.status(500).json({ success: false, error: "Failed to confirm transfer" });
  }
});

transfersRouter.get("/history", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await getUserTransfers(req.user!.userId, { limit, offset });

    res.json({
      success: true,
      data: {
        items: result.items.map((t) => ({
          id: t.id,
          recipientType: t.recipientType,
          recipientName: t.recipientName,
          recipientAccount: t.recipientAccount,
          recipientBank: t.recipientBank,
          amount: Number(t.amount),
          fee: Number(t.fee),
          reference: t.reference,
          status: t.status,
          description: t.description,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error("Get transfer history error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transfer history" });
  }
});

transfersRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const transfer = await findTransferById(req.params.id);
    if (!transfer || transfer.senderId !== req.user!.userId) {
      res.status(404).json({ success: false, error: "Transfer not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: transfer.id,
        recipientType: transfer.recipientType,
        recipientName: transfer.recipientName,
        recipientAccount: transfer.recipientAccount,
        recipientBank: transfer.recipientBank,
        amount: Number(transfer.amount),
        fee: Number(transfer.fee),
        reference: transfer.reference,
        status: transfer.status,
        description: transfer.description,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
      },
    });
  } catch (err) {
    console.error("Get transfer detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch transfer details" });
  }
});

transfersRouter.post("/resend-otp", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user!.userId;

    const transfer = await findTransferByReference(reference);
    if (!transfer || transfer.senderId !== userId || transfer.status !== "pending") {
      res.status(400).json({ success: false, error: "Invalid or completed transfer" });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const otpChannel = user.phoneVerified && user.phone ? "sms" : "email";
    const destination = otpChannel === "sms" ? user.phone! : user.email;

    await issueOtp({
      userId,
      type: "transfer",
      channel: otpChannel,
      destination,
      title: "Transfer Verification Code",
      actionLabel: "confirm your wallet transfer",
      ttlMs: OTP_TTL_MS,
    });

    res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ success: false, error: "Failed to resend OTP" });
  }
});

transfersRouter.post("/cancel", authMiddleware, async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user!.userId;

    const transfer = await findTransferByReference(reference);
    if (!transfer || transfer.senderId !== userId) {
      res.status(404).json({ success: false, error: "Transfer not found" });
      return;
    }

    if (transfer.status !== "pending") {
      res.status(400).json({ success: false, error: `Cannot cancel transfer with status: ${transfer.status}` });
      return;
    }

    await updateTransferStatus(transfer.id, "failed");

    const pendingDebit = await prisma.transaction.findFirst({
      where: { userId, reference, status: "pending" },
    });
    if (pendingDebit) {
      await reverseTransaction(pendingDebit.id);
    }

    res.json({ success: true, message: "Transfer cancelled and funds returned to wallet" });
  } catch (err) {
    console.error("Cancel transfer error:", err);
    res.status(500).json({ success: false, error: "Failed to cancel transfer" });
  }
});
