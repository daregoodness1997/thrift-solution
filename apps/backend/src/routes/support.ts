import { Router, Request } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  listTicketCategories,
  getAllTicketCategories,
  createTicketCategory,
  updateTicketCategory,
  deleteTicketCategory,
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  deleteTicket,
  addTicketMessage,
  softDeleteTicketMessage,
  getTicketStats,
} from "@thrift/db";

const VALID_STATUSES = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
const SUPPORT_ROLES = ["support", "admin", "superadmin", "moderator", "finance"];

export const supportRouter = Router();

function isSupportRole(role?: string) {
  return !!role && SUPPORT_ROLES.includes(role);
}

supportRouter.use(authMiddleware);

// Categories (visible to any authenticated user for the create form)
supportRouter.get("/categories", async (_req, res) => {
  try {
    const categories = await listTicketCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("List ticket categories error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
});

// List tickets — members see only their own; support roles see all (with filters)
supportRouter.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const search = req.query.search as string | undefined;

    const opts: Parameters<typeof listTickets>[0] = { page, limit };
    if (status && VALID_STATUSES.includes(status)) opts.status = status as any;
    if (priority && VALID_PRIORITIES.includes(priority)) opts.priority = priority as any;
    if (categoryId) opts.categoryId = categoryId;
    if (assigneeId) opts.assigneeId = assigneeId;
    if (search) opts.search = search;

    if (!isSupportRole(req.user!.role)) {
      opts.userId = req.user!.userId;
    }

    const result = await listTickets(opts);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("List tickets error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch tickets" });
  }
});

// Create ticket (any authenticated user)
supportRouter.post("/", async (req, res) => {
  try {
    const { subject, description, priority, categoryId } = req.body;
    if (!subject || !description) {
      res.status(400).json({ success: false, error: "Subject and description are required" });
      return;
    }

    const ticket = await createTicket(req.user!.userId, {
      subject,
      description,
      priority: priority && VALID_PRIORITIES.includes(priority) ? priority : "normal",
      categoryId: categoryId || undefined,
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ success: false, error: "Failed to create ticket" });
  }
});

// Get single ticket
supportRouter.get("/:id", async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }
    if (!isSupportRole(req.user!.role) && ticket.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch ticket" });
  }
});

// Add a message/reply to a ticket
supportRouter.post("/:id/messages", async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }
    if (!isSupportRole(req.user!.role) && ticket.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const { body, isInternal } = req.body;
    if (!body || !body.trim()) {
      res.status(400).json({ success: false, error: "Message body is required" });
      return;
    }

    const isInternalFlag = !!isInternal && isSupportRole(req.user!.role);
    const message = await addTicketMessage(req.params.id, req.user!.userId, {
      body,
      isInternal: isInternalFlag,
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error("Add ticket message error:", err);
    res.status(500).json({ success: false, error: "Failed to add message" });
  }
});

supportRouter.delete("/:id/messages/:messageId", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const ok = await softDeleteTicketMessage(req.params.messageId);
    if (!ok) {
      res.status(404).json({ success: false, error: "Message not found" });
      return;
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("Delete ticket message error:", err);
    res.status(500).json({ success: false, error: "Failed to delete message" });
  }
});

// Support-only: update ticket fields
supportRouter.patch("/:id", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const { subject, status, priority, categoryId, assigneeId } = req.body;
    const input: Parameters<typeof updateTicket>[1] = {};
    if (subject !== undefined) input.subject = subject;
    if (status !== undefined) input.status = VALID_STATUSES.includes(status) ? status : undefined;
    if (priority !== undefined) input.priority = VALID_PRIORITIES.includes(priority) ? priority : undefined;
    if (categoryId !== undefined) input.categoryId = categoryId;
    if (assigneeId !== undefined) input.assigneeId = assigneeId;

    const updated = await updateTicket(req.params.id, input);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update ticket error:", err);
    res.status(500).json({ success: false, error: "Failed to update ticket" });
  }
});

supportRouter.post("/:id/assign", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const updated = await assignTicket(req.params.id, assigneeId || null);
    if (!updated) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Assign ticket error:", err);
    res.status(500).json({ success: false, error: "Failed to assign ticket" });
  }
});

supportRouter.delete("/:id", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const ok = await deleteTicket(req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("Delete ticket error:", err);
    res.status(500).json({ success: false, error: "Failed to delete ticket" });
  }
});

// Support-only admin management of categories
supportRouter.get("/admin/categories", requireRole(...SUPPORT_ROLES), async (_req, res) => {
  try {
    const categories = await getAllTicketCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("List all categories error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
});

supportRouter.post("/admin/categories", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const { name, description, slug, position } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, error: "Name and slug are required" });
      return;
    }
    const category = await createTicketCategory({ name, description, slug, position });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ success: false, error: "Failed to create category" });
  }
});

supportRouter.patch("/admin/categories/:id", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const { name, description, slug, isActive, position } = req.body;
    const updated = await updateTicketCategory(req.params.id, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(position !== undefined ? { position } : {}),
    });
    if (!updated) {
      res.status(404).json({ success: false, error: "Category not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ success: false, error: "Failed to update category" });
  }
});

supportRouter.delete("/admin/categories/:id", requireRole(...SUPPORT_ROLES), async (req, res) => {
  try {
    const ok = await deleteTicketCategory(req.params.id);
    if (!ok) {
      res.status(404).json({ success: false, error: "Category not found" });
      return;
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ success: false, error: "Failed to delete category" });
  }
});

// Support dashboard stats
supportRouter.get("/admin/stats", requireRole(...SUPPORT_ROLES), async (_req, res) => {
  try {
    const stats = await getTicketStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Ticket stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch ticket stats" });
  }
});

// List agents eligible for ticket assignment
supportRouter.get("/admin/agents", requireRole(...SUPPORT_ROLES), async (_req, res) => {
  try {
    const { listUsers } = await import("@thrift/db");
    const result = await listUsers({ role: "support", limit: 100 });
    const agents = (result.items || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
    res.json({ success: true, data: agents });
  } catch (err) {
    console.error("List agents error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch agents" });
  }
});
