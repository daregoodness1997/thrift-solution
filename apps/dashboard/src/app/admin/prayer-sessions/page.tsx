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

interface PrayerSession {
  id: string;
  title: string;
  description: string | null;
  streamUrl: string | null;
  startTime: string;
  endTime: string | null;
  isLive: boolean;
  isRecurring: boolean;
  recurrence: string | null;
  joinLink: string | null;
  createdAt: string;
}

export default function AdminPrayerSessionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { message, show } = useFlashMessage();
  const showRef = useRef(show);
  showRef.current = show;

  const [items, setItems] = useState<PrayerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [liveFilter, setLiveFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<PrayerSession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    streamUrl: "",
    startTime: "",
    endTime: "",
    isLive: false,
    isRecurring: false,
    recurrence: "",
    joinLink: "",
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
      if (liveFilter) sp.set("isLive", liveFilter);
      const res = await fetch(`${API_URL}/api/prayer-sessions/admin?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total || 0);
      }
    } catch {
      showRef.current("error", "Failed to fetch prayer sessions");
    }
    setLoading(false);
  }, [token, isAdmin, page, debounced, liveFilter]);

  useEffect(() => {
    if (isAdmin && token) fetchAll();
  }, [isAdmin, token, fetchAll]);

  const openCreate = () => {
    setEditingSession(null);
    setFormData({ title: "", description: "", streamUrl: "", startTime: "", endTime: "", isLive: false, isRecurring: false, recurrence: "", joinLink: "" });
    setShowModal(true);
  };

  const openEdit = (session: PrayerSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || "",
      streamUrl: session.streamUrl || "",
      startTime: session.startTime.slice(0, 16),
      endTime: session.endTime ? session.endTime.slice(0, 16) : "",
      isLive: session.isLive,
      isRecurring: session.isRecurring,
      recurrence: session.recurrence || "",
      joinLink: session.joinLink || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.startTime) {
      showRef.current("error", "Title and start time are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingSession
        ? `${API_URL}/api/prayer-sessions/admin/${editingSession.id}`
        : `${API_URL}/api/prayer-sessions/admin`;
      const method = editingSession ? "PATCH" : "POST";
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
        showRef.current("success", editingSession ? "Session updated" : "Session created");
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

  const handleDelete = async (session: PrayerSession) => {
    if (!confirm(`Delete "${session.title}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/prayer-sessions/admin/${session.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", "Session deleted");
        fetchAll();
      } else {
        showRef.current("error", data.error || "Failed");
      }
    } catch {
      showRef.current("error", "Failed");
    }
  };

  const toggleLive = async (session: PrayerSession) => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-sessions/admin/${session.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLive: !session.isLive }),
      });
      const data = await res.json();
      if (data.success) {
        showRef.current("success", data.isLive ? "Session is now LIVE" : "Session ended");
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
        heading="Prayer Sessions"
        accentText="Management"
        description="Manage live and scheduled prayer sessions with streaming links."
      />

      <ActionMessage message={message} />

      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            />
            <select
              value={liveFilter}
              onChange={(e) => {
                setLiveFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none"
            >
              <option value="">All Status</option>
              <option value="true">Live</option>
              <option value="false">Not Live</option>
            </select>
            <button
              onClick={openCreate}
              className="rounded-lg bg-brand-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-brand-secondary"
            >
              + New Session
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-gray-500">
              Loading prayer sessions...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">
              No prayer sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                    <th className="pb-3 text-left font-semibold">Title</th>
                    <th className="pb-3 text-left font-semibold">Start Time</th>
                    <th className="pb-3 text-left font-semibold">End Time</th>
                    <th className="pb-3 text-center font-semibold">Status</th>
                    <th className="pb-3 text-left font-semibold">Stream/Join</th>
                    <th className="pb-3 text-left font-semibold">Created</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <span className="block font-semibold text-brand-dark">
                          {s.title}
                        </span>
                        {s.isRecurring && (
                          <span className="text-[11px] text-gray-500">
                            Recurring: {s.recurrence}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">
                        {formatDate(new Date(s.startTime))}
                      </td>
                      <td className="py-3 text-gray-600">
                        {s.endTime ? formatDate(new Date(s.endTime)) : "-"}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => toggleLive(s)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${
                            s.isLive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {s.isLive ? "LIVE" : "Scheduled"}
                        </button>
                      </td>
                      <td className="py-3">
                        {s.streamUrl && (
                          <span className="text-[10px] text-blue-600 block truncate max-w-[150px]">
                            Stream URL
                          </span>
                        )}
                        {s.joinLink && (
                          <span className="text-[10px] text-green-600 block truncate max-w-[150px]">
                            Join Link
                          </span>
                        )}
                        {!s.streamUrl && !s.joinLink && <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(new Date(s.createdAt))}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(s)}
                            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
                            style={btnStyle("#2563EB")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-brand-dark">
              {editingSession ? "Edit Prayer Session" : "Create Prayer Session"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Global Scholar Intercession"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Session description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Stream URL (YouTube, Vimeo, etc.)
                </label>
                <input
                  type="url"
                  value={formData.streamUrl}
                  onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://youtube.com/live/..."
                />
              </div>
              <div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLive"
                    checked={formData.isLive}
                    onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isLive" className="text-xs font-medium text-gray-700">
                    Live Now
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isRecurring" className="text-xs font-medium text-gray-700">
                    Recurring
                  </label>
                </div>
              </div>
              {formData.isRecurring && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Recurrence Pattern
                  </label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
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
                {saving ? "Saving..." : editingSession ? "Update" : "Create"}
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
