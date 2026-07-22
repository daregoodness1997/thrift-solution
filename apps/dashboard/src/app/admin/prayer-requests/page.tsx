"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

interface PrayerRequest {
  id: string;
  authorName: string;
  location: string | null;
  category: string;
  request: string;
  prayersCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPrayerRequestsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { message, show } = useFlashMessage();
  const showRef = useRef(show);
  showRef.current = show;

  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerRequest | null>(null);
  const [formData, setFormData] = useState({
    authorName: "",
    location: "",
    category: "Academic & Exams",
    request: "",
    isActive: true,
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
      if (categoryFilter) sp.set("category", categoryFilter);
      if (statusFilter) sp.set("isActive", statusFilter);
      const res = await fetch(`${API_URL}/api/prayer-requests/admin?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {
      showRef.current("error", "Failed to fetch prayer requests");
    }
    setLoading(false);
  }, [token, isAdmin, page, debounced, categoryFilter, statusFilter]);

  useEffect(() => {
    if (isAdmin && token) fetchAll();
  }, [isAdmin, token, fetchAll]);

  const openCreate = () => {
    setEditingPrayer(null);
    setFormData({ authorName: "", location: "", category: "Academic & Exams", request: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (prayer: PrayerRequest) => {
    setEditingPrayer(prayer);
    setFormData({
      authorName: prayer.authorName,
      location: prayer.location || "",
      category: prayer.category,
      request: prayer.request,
      isActive: prayer.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.authorName.trim() || !formData.request.trim()) {
      showRef.current("error", "Author name and request are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingPrayer
        ? `${API_URL}/api/prayer-requests/admin/${editingPrayer.id}`
        : `${API_URL}/api/prayer-requests`;
      const method = editingPrayer ? "PATCH" : "POST";
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
        showRef.current("success", editingPrayer ? "Prayer request updated" : "Prayer request created");
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

  const handleDelete = async (prayer: PrayerRequest) => {
    if (!confirm(`Delete "${prayer.authorName}'s" prayer request?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/admin/${prayer.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", "Prayer request deleted");
        fetchAll();
      } else {
        showRef.current("error", data.error || "Failed");
      }
    } catch {
      showRef.current("error", "Failed");
    }
  };

  const toggleStatus = async (prayer: PrayerRequest) => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/admin/${prayer.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !prayer.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", data.isActive ? "Prayer request activated" : "Prayer request deactivated");
        fetchAll();
      }
    } catch {
      showRef.current("error", "Failed to update status");
    }
  };

  if (authLoading || !isAdmin) return null;

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

  const categories = ["Academic & Exams", "Micro-Loan & Equipment", "Family & Health", "Career Breakthrough", "Spiritual Wisdom"];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Admin"
        heading="Prayer Requests"
        accentText="Management"
        description="Manage interdenominational prayer network requests."
      />

      <ActionMessage message={message} />

      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              placeholder="Search prayers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
              + New Request
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">
              Loading prayer requests...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No prayer requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Author</th>
                    <th className="pb-3 text-left font-semibold">Category</th>
                    <th className="pb-3 text-left font-semibold">Request</th>
                    <th className="pb-3 text-right font-semibold">Prayers</th>
                    <th className="pb-3 text-left font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Created</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">
                          {p.authorName}
                        </span>
                        {p.location && (
                          <span className="text-[11px] text-gray-500">
                            {p.location}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 max-w-[250px]">
                        <span className="text-[11px] text-gray-600 line-clamp-2">
                          {p.request}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono">
                        {p.prayersCount}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleStatus(p)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(new Date(p.createdAt))}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={btnStyle("#2563EB")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
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
              {editingPrayer ? "Edit Prayer Request" : "Create Prayer Request"}
            </h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Author Name *
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                className={inputClass}
                placeholder="e.g. Fellow Grace"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={inputClass}
                placeholder="e.g. Nairobi, Kenya"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Prayer Request *
              </label>
              <textarea
                value={formData.request}
                onChange={(e) => setFormData({ ...formData, request: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Share the prayer request..."
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
                Active (visible on landing page)
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
                {saving ? "Saving..." : editingPrayer ? "Update" : "Create"}
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
