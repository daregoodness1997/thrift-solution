import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createConversation,
  getOrCreateConversation,
  findUserById,
  prisma,
} from "@thrift/db";
import { notifyUsers } from "../services/notifications";

export const chatRouter = Router();

chatRouter.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const result = await getUserConversations(req.user!.userId, { page, limit, search });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch conversations" });
  }
});

chatRouter.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getConversationMessages(req.params.id, req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

chatRouter.post("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ success: false, error: "Message text is required" });
      return;
    }
    const message = await sendMessage(req.params.id, req.user!.userId, text.trim());

    const members = await prisma.conversationMember.findMany({
      where: { conversationId: req.params.id, userId: { not: req.user!.userId } },
      select: { userId: true },
    });
    const recipientIds = members.map((m) => m.userId);

    if (recipientIds.length > 0) {
      const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3001";
      await notifyUsers(recipientIds, {
        type: "chat_message",
        title: "New message",
        body: `${req.user!.email} sent you a message: "${text.trim().slice(0, 120)}"`,
        data: { conversationId: req.params.id, messageId: message.id },
        email: {
          subject: "You have a new message",
          heading: "New message",
          text: `${req.user!.email} sent you a message:\n\n${text.trim()}`,
          cta: {
            label: "View conversation",
            url: `${dashboardUrl}/chat/${req.params.id}`,
          },
        },
        sms: { message: `GFW: New message from ${req.user!.email}.` },
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

chatRouter.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({ success: false, error: "At least one member ID is required" });
      return;
    }
    const conversation = await createConversation(name || null, [req.user!.userId, ...memberIds]);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ success: false, error: "Failed to create conversation" });
  }
});

chatRouter.post("/conversations/dm/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const targetUser = await findUserById(req.params.targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const conversation = await getOrCreateConversation(req.user!.userId, req.params.targetUserId);
    res.json({ success: true, data: conversation });
  } catch (err) {
    console.error("Get/create DM error:", err);
    res.status(500).json({ success: false, error: "Failed to create conversation" });
  }
});

chatRouter.get("/users/search", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    if (q.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }
    const { prisma } = await import("@thrift/db");
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.userId } },
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ success: false, error: "Failed to search users" });
  }
});
