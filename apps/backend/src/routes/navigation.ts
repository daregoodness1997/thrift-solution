import { Router } from "express";
import { findUserById, getNavigationForRole, getAllNavigationItems, createNavigationItem, updateNavigationItem, deleteNavigationItem, assignNavigationToRole, removeNavigationFromRole, getRoles } from "@thrift/db";
import { authMiddleware } from "../middleware/auth";

export const navigationRouter = Router();

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, async () => {
    const user = await findUserById(req.user!.userId);
    if (!user || user.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }
    next();
  });
}

navigationRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const sections = await getNavigationForRole(user.role);
    res.json({ success: true, data: sections });
  } catch (err) {
    console.error("Navigation fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch navigation" });
  }
});

navigationRouter.get("/admin/items", adminMiddleware, async (req, res) => {
  try {
    const items = await getAllNavigationItems();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Admin navigation items fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch navigation items" });
  }
});

navigationRouter.post("/admin/items", adminMiddleware, async (req, res) => {
  try {
    const { label, href, icon, section, sortOrder } = req.body;
    if (!label || !href || !icon) {
      res.status(400).json({ success: false, error: "Label, href, and icon are required" });
      return;
    }

    const item = await createNavigationItem({ label, href, icon, section, sortOrder });
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    console.error("Admin navigation item create error:", err);
    if (err.code === "P2002") {
      res.status(409).json({ success: false, error: "Navigation item with this href already exists" });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to create navigation item" });
  }
});

navigationRouter.put("/admin/items/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, href, icon, section, sortOrder, isActive } = req.body;

    const item = await updateNavigationItem(id, { label, href, icon, section, sortOrder, isActive });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error("Admin navigation item update error:", err);
    res.status(500).json({ success: false, error: "Failed to update navigation item" });
  }
});

navigationRouter.delete("/admin/items/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteNavigationItem(id);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin navigation item delete error:", err);
    res.status(500).json({ success: false, error: "Failed to delete navigation item" });
  }
});

navigationRouter.get("/admin/roles", adminMiddleware, async (req, res) => {
  try {
    const roles = await getRoles();
    res.json({ success: true, data: roles });
  } catch (err) {
    console.error("Admin roles fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch roles" });
  }
});

navigationRouter.post("/admin/roles/assign", adminMiddleware, async (req, res) => {
  try {
    const { role, navigationItemId, sortOrder } = req.body;
    if (!role || !navigationItemId) {
      res.status(400).json({ success: false, error: "Role and navigationItemId are required" });
      return;
    }

    const assignment = await assignNavigationToRole(role, navigationItemId, sortOrder);
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error("Admin role assign error:", err);
    res.status(500).json({ success: false, error: "Failed to assign navigation to role" });
  }
});

navigationRouter.post("/admin/roles/remove", adminMiddleware, async (req, res) => {
  try {
    const { role, navigationItemId } = req.body;
    if (!role || !navigationItemId) {
      res.status(400).json({ success: false, error: "Role and navigationItemId are required" });
      return;
    }

    await removeNavigationFromRole(role, navigationItemId);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin role remove error:", err);
    res.status(500).json({ success: false, error: "Failed to remove navigation from role" });
  }
});
