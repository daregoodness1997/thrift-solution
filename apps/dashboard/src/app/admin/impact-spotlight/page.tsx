"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";
import { SimpleTable, SimpleColumn } from "@/components/SimpleTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const LIMIT = 20;

type Tab = "narratives" | "gallery" | "timeline";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  tag: string;
  sortOrder: number;
}

interface TimelineMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  tag: string;
  status: string;
  sortOrder: number;
}

interface Narrative {
  id: string;
  name: string;
  age: number;
  country: string;
  countryCode: string;
  role: string;
  cohort: string;
  avatarUrl: string;
  coverImageUrl: string;
  headlineQuote: string;
  impactMetric: string;
  impactLabel: string;
  longFormNarrative: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  gallery: GalleryPhoto[];
  timeline: TimelineMilestone[];
}

export default function AdminImpactSpotlightPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { message, show } = useFlashMessage();
  const showRef = useRef(show);
  showRef.current = show;

  const [activeTab, setActiveTab] = useState<Tab>("narratives");
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [narrPage, setNarrPage] = useState(1);
  const [narrTotalPages, setNarrTotalPages] = useState(1);
  const [narrTotal, setNarrTotal] = useState(0);
  const [narrSearch, setNarrSearch] = useState("");
  const [narrStatusFilter, setNarrStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const role = user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    if (!authLoading && role && !isAdmin) {
      router.replace("/");
    }
  }, [authLoading, role, isAdmin, router]);

  const fetchNarratives = useCallback(async () => {
    if (!token || !isAdmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(narrPage), limit: String(LIMIT) });
      if (narrSearch) sp.set("search", narrSearch);
      if (narrStatusFilter) sp.set("isActive", narrStatusFilter);
      const res = await fetch(`${API_URL}/api/impact/admin/narratives?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNarratives(data.data.items || []);
        setNarrTotalPages(data.data.totalPages || 1);
        setNarrTotal(data.data.total || 0);
      }
    } catch {
      showRef.current("error", "Failed to fetch narratives");
    }
    setLoading(false);
  }, [token, isAdmin, narrPage, narrSearch, narrStatusFilter]);

  useEffect(() => {
    if (isAdmin && token) fetchNarratives();
  }, [isAdmin, token, fetchNarratives]);

  const openCreate = () => { setEditingItem(null); setShowModal(true); };
  const openEdit = (item: unknown) => { setEditingItem(item); setShowModal(true); };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/impact/admin/narratives/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { showRef.current("success", "Deleted successfully"); fetchNarratives(); }
      else showRef.current("error", data.error || "Failed");
    } catch { showRef.current("error", "Failed"); }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/impact/admin/narratives/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) { showRef.current("success", data.isActive ? "Activated" : "Deactivated"); fetchNarratives(); }
    } catch { showRef.current("error", "Failed to update status"); }
  };

  if (authLoading || !isAdmin) return null;

  const inputClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[13px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:bg-slate-800 dark:text-white";

  const tabs: { key: Tab; label: string }[] = [
    { key: "narratives", label: "Learner Narratives" },
    { key: "gallery", label: "Gallery Photos" },
    { key: "timeline", label: "Timeline Milestones" },
  ];

  const narrativeColumns: SimpleColumn<Narrative>[] = [
    {
      key: "name",
      header: "Name",
      render: (n) => (
        <div className="flex items-center gap-2">
          <img src={n.avatarUrl} alt={n.name} className="h-8 w-8 rounded-full object-cover" />
          <span className="font-semibold text-slate-900 dark:text-white">{n.name}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (n) => `${n.countryCode} ${n.country}`,
    },
    {
      key: "role",
      header: "Role",
      render: (n) => (
        <span className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate block">{n.role}</span>
      ),
    },
    {
      key: "gallery.length",
      header: "Photos",
      align: "right",
      mono: true,
      render: (n) => n.gallery.length,
    },
    {
      key: "timeline.length",
      header: "Milestones",
      align: "right",
      mono: true,
      render: (n) => n.timeline.length,
    },
    {
      key: "isActive",
      header: "Status",
      render: (n) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(n.id, n.isActive);
          }}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${n.isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
        >
          {n.isActive ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (n) => (
        <span className="text-slate-500 dark:text-slate-400">{formatDate(new Date(n.createdAt))}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (n) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(n);
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
            style={btnStyle("#2563EB")}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(n.id, n.name);
            }}
            className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold"
            style={btnStyle("#DC2626")}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Impact Spotlight" accentText="Management" description="Manage learner narratives with photo galleries and milestone timelines." />
      <ActionMessage message={message} />
      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[13px] font-semibold transition-colors ${activeTab === tab.key ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "narratives" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <input placeholder="Search narratives..." value={narrSearch} onChange={(e) => { setNarrSearch(e.target.value); setNarrPage(1); }} className="min-w-[200px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white" />
                <select value={narrStatusFilter} onChange={(e) => { setNarrStatusFilter(e.target.value); setNarrPage(1); }} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] outline-none dark:bg-slate-800 dark:text-white">
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700">+ New Narrative</button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">Loading...</div>
              ) : narratives.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">No narratives found.</div>
              ) : (
                <SimpleTable
                  columns={narrativeColumns}
                  data={narratives}
                  minWidth="800px"
                />
              )}
              <Pagination page={narrPage} totalPages={narrTotalPages} total={narrTotal} limit={LIMIT} onPageChange={setNarrPage} loading={loading} />
            </>
          )}

          {activeTab === "gallery" && (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Gallery photos are managed within each narrative. Edit a narrative to add/remove photos.
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Timeline milestones are managed within each narrative. Edit a narrative to add/remove milestones.
            </div>
          )}
        </Card>
      </FadeInUp>

      {showModal && (
        <NarrativeModal
          editingItem={editingItem}
          setShowModal={setShowModal}
          setSaving={setSaving}
          saving={saving}
          token={token}
          show={showRef.current}
          onSaved={() => { setShowModal(false); fetchNarratives(); }}
          inputClass={inputClass}
        />
      )}
    </div>
  );
}

function NarrativeModal({
  editingItem, setShowModal, setSaving, saving, token, show, onSaved, inputClass,
}: {
  editingItem: unknown; setShowModal: (v: boolean) => void;
  setSaving: (v: boolean) => void; saving: boolean; token: string | null;
  show: (type: "success" | "error", msg: string) => void; onSaved: () => void; inputClass: string;
}) {
  const [form, setForm] = useState({
    name: "", age: 20, country: "", countryCode: "", role: "", cohort: "",
    avatarUrl: "", coverImageUrl: "", headlineQuote: "", impactMetric: "", impactLabel: "",
    longFormNarrative: "", sortOrder: 0, isActive: true,
    galleryJson: "", timelineJson: "",
  });

  useEffect(() => {
    if (editingItem) {
      const item = editingItem as Narrative;
      setForm({
        name: item.name || "", age: item.age || 20, country: item.country || "",
        countryCode: item.countryCode || "", role: item.role || "", cohort: item.cohort || "",
        avatarUrl: item.avatarUrl || "", coverImageUrl: item.coverImageUrl || "",
        headlineQuote: item.headlineQuote || "", impactMetric: item.impactMetric || "",
        impactLabel: item.impactLabel || "",
        longFormNarrative: (item.longFormNarrative || []).join("\n\n"),
        sortOrder: item.sortOrder || 0, isActive: item.isActive ?? true,
        galleryJson: JSON.stringify(item.gallery || [], null, 2),
        timelineJson: JSON.stringify(item.timeline || [], null, 2),
      });
    }
  }, [editingItem]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.headlineQuote.trim()) {
      show("error", "Name and headline quote are required");
      return;
    }
    setSaving(true);
    try {
      const longFormNarrative = form.longFormNarrative.split("\n\n").filter((p) => p.trim());
      let gallery: GalleryPhoto[] = [];
      let timeline: TimelineMilestone[] = [];
      try { gallery = form.galleryJson ? JSON.parse(form.galleryJson) : []; } catch { show("error", "Invalid gallery JSON"); setSaving(false); return; }
      try { timeline = form.timelineJson ? JSON.parse(form.timelineJson) : []; } catch { show("error", "Invalid timeline JSON"); setSaving(false); return; }

      const body = {
        name: form.name.trim(), age: Number(form.age), country: form.country.trim(),
        countryCode: form.countryCode.trim(), role: form.role.trim(), cohort: form.cohort.trim(),
        avatarUrl: form.avatarUrl, coverImageUrl: form.coverImageUrl,
        headlineQuote: form.headlineQuote.trim(), impactMetric: form.impactMetric,
        impactLabel: form.impactLabel, longFormNarrative,
        sortOrder: form.sortOrder, isActive: form.isActive, gallery, timeline,
      };

      const url = editingItem
        ? `${API_URL}/api/impact/admin/narratives/${(editingItem as Narrative).id}`
        : `${API_URL}/api/impact/admin/narratives`;
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { show("success", editingItem ? "Updated successfully" : "Created successfully"); onSaved(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{editingItem ? "Edit" : "Create"} Learner Narrative</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Age</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Country</label><input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Country Code</label><input type="text" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} className={inputClass} placeholder="🇰🇪" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Role</label><input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Cohort</label><input type="text" value={form.cohort} onChange={(e) => setForm({ ...form, cohort: e.target.value })} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Avatar URL</label><input type="text" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Cover Image URL</label><input type="text" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Headline Quote *</label><textarea value={form.headlineQuote} onChange={(e) => setForm({ ...form, headlineQuote: e.target.value })} className={`${inputClass} resize-none`} rows={2} /></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Impact Metric</label><input type="text" value={form.impactMetric} onChange={(e) => setForm({ ...form, impactMetric: e.target.value })} className={inputClass} placeholder="1,420" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Impact Label</label><input type="text" value={form.impactLabel} onChange={(e) => setForm({ ...form, impactLabel: e.target.value })} className={inputClass} placeholder="Households Connected" /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Long Form Narrative (separate paragraphs with blank lines)</label><textarea value={form.longFormNarrative} onChange={(e) => setForm({ ...form, longFormNarrative: e.target.value })} className={`${inputClass} resize-none`} rows={4} /></div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Gallery Photos (JSON array)</label>
          <textarea value={form.galleryJson} onChange={(e) => setForm({ ...form, galleryJson: e.target.value })} className={`${inputClass} resize-none font-mono text-[11px]`} rows={4} placeholder='[{"url":"...","caption":"...","tag":"..."}]' />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Timeline Milestones (JSON array)</label>
          <textarea value={form.timelineJson} onChange={(e) => setForm({ ...form, timelineJson: e.target.value })} className={`${inputClass} resize-none font-mono text-[11px]`} rows={4} placeholder='[{"year":"2024","title":"...","description":"...","tag":"...","status":"completed"}]' />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputClass} /></div>
          <div className="flex items-end"><div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" /><label htmlFor="isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">Active</label></div></div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : editingItem ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return { padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "10px", fontWeight: 600, border: `1px solid ${color}40`, backgroundColor: `${color}0F`, color, cursor: "pointer" };
}
