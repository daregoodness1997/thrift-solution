"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  ActionMessage,
  useFlashMessage,
} from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface WhatsappGroup {
  id: string;
  name: string;
  description: string | null;
  circleName: string | null;
  inviteLink: string | null;
  memberCount: number;
  pinned: boolean;
  createdAt: string;
}

export default function AdminWhatsappGroupsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

  const [items, setItems] = useState<WhatsappGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsappGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    circleName: "",
    inviteLink: "",
    pinned: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debounced) sp.set("search", debounced);
      const res = await fetch(`${API_URL}/api/admin/whatsapp-groups?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {
      show("error", "Failed to fetch groups");
    }
    setLoading(false);
  }, [token, isAdmin, page, debounced, show]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditingGroup(null);
    setFormData({ name: "", description: "", circleName: "", inviteLink: "", pinned: false });
    setShowCreateModal(true);
  };

  const openEdit = (group: WhatsappGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      circleName: group.circleName || "",
      inviteLink: group.inviteLink || "",
      pinned: group.pinned,
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      show("error", "Group name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editingGroup
        ? `${API_URL}/api/admin/whatsapp-groups/${editingGroup.id}`
        : `${API_URL}/api/admin/whatsapp-groups`;
      const method = editingGroup ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        show("success", editingGroup ? "Group updated" : "Group created");
        setShowCreateModal(false);
        fetchAll();
      } else {
        show("error", data.error || "Failed");
      }
    } catch {
      show("error", "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (group: WhatsappGroup) => {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp-groups/${group.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        show("success", "Group deleted");
        fetchAll();
      } else {
        show("error", data.error || "Failed");
      }
    } catch {
      show("error", "Failed");
    }
  };

  if (authLoading || !isAdmin) return null;

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="WhatsApp Groups"
        accentText="Management"
        description="Create and manage WhatsApp groups for the community."
      />

      <ActionMessage message={message} />

      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <button
              onClick={openCreate}
              className="rounded-lg bg-brand-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-brand-secondary"
            >
              + New Group
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">
              Loading groups...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No WhatsApp groups found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Name</th>
                    <th className="pb-3 text-left font-semibold">Circle</th>
                    <th className="pb-3 text-right font-semibold">Members</th>
                    <th className="pb-3 text-left font-semibold">Pinned</th>
                    <th className="pb-3 text-left font-semibold">Created</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">
                          {g.name}
                        </span>
                        {g.description && (
                          <span className="text-[11px] text-gray-500">
                            {g.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">
                        {g.circleName || "—"}
                      </td>
                      <td className="py-3 text-right font-mono">
                        {g.memberCount}
                      </td>
                      <td className="py-3">
                        {g.pinned ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Pinned
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(new Date(g.createdAt))}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(g)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={btnStyle("#2563EB")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(g)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={btnStyle("#DC2626")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={setPage}
            loading={loading}
          />
        </Card>
      </FadeInUp>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-brand-dark">
              {editingGroup ? "Edit Group" : "Create WhatsApp Group"}
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Savings Tips & Advice"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="What is this group about?"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Circle Name
              </label>
              <input
                type="text"
                value={formData.circleName}
                onChange={(e) => setFormData({ ...formData, circleName: e.target.value })}
                className={inputClass}
                placeholder="e.g. All Circles, Community"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Invite Link
              </label>
              <input
                type="url"
                value={formData.inviteLink}
                onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
                className={inputClass}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="pinned" className="text-xs font-medium text-gray-700">
                Pin this group
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-secondary disabled:opacity-50"
              >
                {saving ? "Saving..." : editingGroup ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "10px",
    fontWeight: 600,
    border: `1px solid ${color}40`,
    backgroundColor: `${color}0F`,
    color,
    cursor: "pointer",
  };
}
