"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";

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

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

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
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button
              onClick={openCreate}
              className="rounded-lg bg-brand-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-brand-secondary"
            >
              + New Hour
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">
              Loading intercessory hours...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No intercessory hours found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Name</th>
                    <th className="pb-3 text-left font-semibold">Time (UTC)</th>
                    <th className="pb-3 text-left font-semibold">Join Link</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">
                          {h.name}
                        </span>
                        {h.description && (
                          <span className="text-[11px] text-gray-500 line-clamp-1">
                            {h.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-gray-600">
                        {h.timeUtc}
                      </td>
                      <td className="py-3">
                        {h.joinLink ? (
                          <a
                            href={h.joinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 hover:underline truncate block max-w-[200px]"
                          >
                            {h.joinLink}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleStatus(h)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                            h.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {h.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(h)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={btnStyle("#2563EB")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(h)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-brand-dark">
              {editingHour ? "Edit Intercessory Hour" : "Create Intercessory Hour"}
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
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
              <label htmlFor="isActive" className="text-xs font-medium text-gray-700">
                Active (visible on website)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-secondary disabled:opacity-50"
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
