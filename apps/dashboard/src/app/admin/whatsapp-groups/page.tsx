"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";

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
  }, [token, isAdmin, page, debounced]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
      circleName: "",
      inviteLink: "",
      pinned: false,
    });
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
    if (!editingGroup && !formData.inviteLink.trim()) {
      show("error", "WhatsApp group link is required");
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
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp-groups/${group.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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

  const inputClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400";

  const groupColumns: SimpleColumn<WhatsappGroup>[] = [
    {
      key: "name",
      header: "Name",
      render: (g) => (
        <div>
          <span className="block font-semibold text-slate-900 dark:text-white">
            {g.name}
          </span>
          {g.description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {g.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "circleName",
      header: "Circle",
      render: (g) => (
        <span className="text-slate-500 dark:text-slate-400">
          {g.circleName || "—"}
        </span>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      align: "right",
      mono: true,
      render: (g) => <span>{g.memberCount}</span>,
    },
    {
      key: "pinned",
      header: "Pinned",
      render: (g) =>
        g.pinned ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Pinned
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (g) => (
        <span className="text-slate-500 dark:text-slate-400">
          {formatDate(new Date(g.createdAt))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (g) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(g);
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-blue-400/40 bg-blue-500/[0.06] text-blue-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(g);
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-red-400/40 bg-red-500/[0.06] text-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

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
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
            >
              + New Group
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Loading groups...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No WhatsApp groups found.
            </div>
          ) : (
            <SimpleTable columns={groupColumns} data={items} minWidth="700px" />
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
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {editingGroup ? "Edit Group" : "Create WhatsApp Group"}
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. Savings Tips & Advice"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="What is this group about?"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Circle Name
              </label>
              <input
                type="text"
                value={formData.circleName}
                onChange={(e) =>
                  setFormData({ ...formData, circleName: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. All Circles, Community"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                WhatsApp Group Link *
              </label>
              <input
                type="url"
                value={formData.inviteLink}
                onChange={(e) =>
                  setFormData({ ...formData, inviteLink: e.target.value })
                }
                className={inputClass}
                placeholder="https://chat.whatsapp.com/..."
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Members will use this link to join the WhatsApp group
              </p>
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.pinned}
                onChange={(e) =>
                  setFormData({ ...formData, pinned: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="pinned"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Pin this group
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
