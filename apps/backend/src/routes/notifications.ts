import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  listNotifications,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@thrift/db";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const type = req.query.type as string | undefined;

    const result = await listNotifications(req.user!.userId, { page, limit, unreadOnly, type });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("List notifications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

notificationsRouter.get("/unread-count", async (req, res) => {
  try {
    const count = await getUnreadCount(req.user!.userId);
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch unread count" });
  }
});

notificationsRouter.get("/preferences", async (req, res) => {
  try {
    const prefs = await getNotificationPreferences(req.user!.userId);
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch preferences" });
  }
});

notificationsRouter.put("/preferences", async (req, res) => {
  try {
    const { inApp, email, sms } = req.body;
    const prefs = await updateNotificationPreferences(req.user!.userId, {
      ...(typeof inApp === "boolean" ? { inApp } : {}),
      ...(typeof email === "boolean" ? { email } : {}),
      ...(typeof sms === "boolean" ? { sms } : {}),
    });
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ success: false, error: "Failed to update preferences" });
  }
});

notificationsRouter.post("/:id/read", async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user!.userId);
    if (!notification) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ success: false, error: "Failed to mark notification as read" });
  }
});

notificationsRouter.post("/read-all", async (req, res) => {
  try {
    const count = await markAllNotificationsRead(req.user!.userId);
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ success: false, error: "Failed to mark all as read" });
  }
});

notificationsRouter.delete("/:id", async (req, res) => {
  try {
    const ok = await deleteNotification(req.params.id, req.user!.userId);
    if (!ok) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ success: false, error: "Failed to delete notification" });
  }
});
