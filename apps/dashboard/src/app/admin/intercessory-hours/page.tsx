"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface IntercessoryHour {
  id: string;
  name: string;
  timeUtc: string;
  joinLink: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

export default function AdminIntercessoryHoursPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { message, show } = useFlashMessage();
  const showRef = useRef(show);
  showRef.current = show;

  const [items, setItems] = useState<IntercessoryHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingHour, setEditingHour] = useState<IntercessoryHour | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    timeUtc: "06:00",
    joinLink: "",
    isActive: true,
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const role = user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    if (!authLoading && role && !isAdmin) router.replace("/");
  }, [authLoading, role, isAdmin, router]);

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
      if (statusFilter) sp.set("isActive", statusFilter);
      const res = await fetch(`${API_URL}/api/intercessory-hours/admin?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {
      showRef.current("error", "Failed to fetch intercessory hours");
    }
    setLoading(false);
  }, [token, isAdmin, page, debounced, statusFilter]);

  useEffect(() => {
    if (isAdmin && token) fetchAll();
  }, [isAdmin, token, fetchAll]);

  const openCreate = () => {
    setEditingHour(null);
    setFormData({ name: "", timeUtc: "06:00", joinLink: "", isActive: true, description: "" });
    setShowModal(true);
  };

  const openEdit = (hour: IntercessoryHour) => {
    setEditingHour(hour);
    setFormData({
      name: hour.name,
      timeUtc: hour.timeUtc,
      joinLink: hour.joinLink || "",
      isActive: hour.isActive,
      description: hour.description || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.timeUtc) {
      showRef.current("error", "Name and time are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingHour
        ? `${API_URL}/api/intercessory-hours/admin/${editingHour.id}`
        : `${API_URL}/api/intercessory-hours/admin`;
      const method = editingHour ? "PATCH" : "POST";
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
        showRef.current("success", editingHour ? "Hour updated" : "Hour created");
        setShowModal(false);
        fetchAll();
      } else {
        showRef.current("error", data.error || "Failed");
      }
    } catch {
      showRef.current("error", "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (hour: IntercessoryHour) => {
    if (!confirm(`Delete "${hour.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/intercessory-hours/admin/${hour.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", "Intercessory hour deleted");
        fetchAll();
      } else {
        showRef.current("error", data.error || "Failed");
      }
    } catch {
      showRef.current("error", "Failed");
    }
  };

  const toggleStatus = async (hour: IntercessoryHour) => {
    try {
      const res = await fetch(`${API_URL}/api/intercessory-hours/admin/${hour.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !hour.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", data.isActive ? "Hour activated" : "Hour deactivated");
        fetchAll();
      }
    } catch {
      showRef.current("error", "Failed to update status");
    }
  };

  if (authLoading || !isAdmin) return null;

  const inputClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400";

  const columns: SimpleColumn<IntercessoryHour>[] = [
    {
      key: "name",
      header: "Name",
      render: (h) => (
        <>
          <span className="block font-semibold text-slate-900 dark:text-white">
            {h.name}
          </span>
          {h.description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {h.description}
            </span>
          )}
        </>
      ),
    },
    {
      key: "timeUtc",
      header: "Time (UTC)",
      mono: true,
      render: (h) => h.timeUtc,
    },
    {
      key: "joinLink",
      header: "Join Link",
      render: (h) =>
        h.joinLink ? (
          <a
            href={h.joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:underline truncate block max-w-[200px]"
          >
            {h.joinLink}
          </a>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">-</span>
        ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (h) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(h);
          }}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
            h.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
        >
          {h.isActive ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (h) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(h);
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold border border-blue-400/40 bg-blue-500/[0.06] text-blue-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(h);
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
        heading="Intercessory Hours"
        accentText="Management"
        description="Manage daily scheduled prayer hours with join links."
      />

      <ActionMessage message={message} />

      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              placeholder="Search hours..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
            >
              + New Hour
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Loading intercessory hours...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No intercessory hours found.
            </div>
          ) : (
            <SimpleTable
              columns={columns}
              data={items}
              minWidth="600px"
            />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {editingHour ? "Edit Intercessory Hour" : "Create Intercessory Hour"}
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Morning Strength & Devotional"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Time (UTC) *
              </label>
              <input
                type="time"
                value={formData.timeUtc}
                onChange={(e) => setFormData({ ...formData, timeUtc: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Join Link (Zoom, Google Meet, etc.)
              </label>
              <input
                type="url"
                value={formData.joinLink}
                onChange={(e) => setFormData({ ...formData, joinLink: e.target.value })}
                className={inputClass}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="Description of this prayer hour..."
              />
            </div>
            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Active (visible on website)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingHour ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


