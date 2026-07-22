"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, FadeInUp } from "@thrift/ui";
import { formatDate } from "@thrift/utils";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { ActionMessage, useFlashMessage } from "@/components/AdminShared";

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
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const { message, show } = useFlashMessage();

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
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

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
      show("error", "Failed to fetch narratives");
    }
    setLoading(false);
  }, [token, isAdmin, narrPage, narrSearch, narrStatusFilter, show]);

  useEffect(() => { fetchNarratives(); }, [fetchNarratives]);

  const openCreate = () => { setEditingItem(null); setSelectedNarrativeId(null); setShowModal(true); };
  const openEdit = (item: unknown) => { setEditingItem(item); setSelectedNarrativeId(null); setShowModal(true); };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/impact/admin/narratives/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { show("success", "Deleted successfully"); fetchNarratives(); }
      else show("error", data.error || "Failed");
    } catch { show("error", "Failed"); }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/impact/admin/narratives/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) { show("success", data.isActive ? "Activated" : "Deactivated"); fetchNarratives(); }
    } catch { show("error", "Failed to update status"); }
  };

  if (authLoading || !isAdmin) return null;

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

  const tabs: { key: Tab; label: string }[] = [
    { key: "narratives", label: "Learner Narratives" },
    { key: "gallery", label: "Gallery Photos" },
    { key: "timeline", label: "Timeline Milestones" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader badgeLabel="Admin" heading="Impact Spotlight" accentText="Management" description="Manage learner narratives with photo galleries and milestone timelines." />
      <ActionMessage message={message} />
      <FadeInUp delay={100}>
        <Card padding="1.5rem">
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[13px] font-semibold transition-colors ${activeTab === tab.key ? "border-b-2 border-brand-primary text-brand-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "narratives" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <input placeholder="Search narratives..." value={narrSearch} onChange={(e) => { setNarrSearch(e.target.value); setNarrPage(1); }} className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none" />
                <select value={narrStatusFilter} onChange={(e) => { setNarrStatusFilter(e.target.value); setNarrPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none">
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button onClick={openCreate} className="rounded-lg bg-brand-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-brand-secondary">+ New Narrative</button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-[13px] text-gray-500">Loading...</div>
              ) : narratives.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-gray-500">No narratives found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[12px] min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100 font-mono text-[9px] uppercase tracking-[0.1em] text-gray-500">
                        <th className="pb-3 text-left font-semibold">Name</th>
                        <th className="pb-3 text-left font-semibold">Country</th>
                        <th className="pb-3 text-left font-semibold">Role</th>
                        <th className="pb-3 text-right font-semibold">Photos</th>
                        <th className="pb-3 text-right font-semibold">Milestones</th>
                        <th className="pb-3 text-left font-semibold">Status</th>
                        <th className="pb-3 text-left font-semibold">Created</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {narratives.map((n) => (
                        <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img src={n.avatarUrl} alt={n.name} className="h-8 w-8 rounded-full object-cover" />
                              <span className="font-semibold text-brand-dark">{n.name}</span>
                            </div>
                          </td>
                          <td className="py-3">{n.countryCode} {n.country}</td>
                          <td className="py-3 text-gray-600 max-w-[200px] truncate">{n.role}</td>
                          <td className="py-3 text-right font-mono">{n.gallery.length}</td>
                          <td className="py-3 text-right font-mono">{n.timeline.length}</td>
                          <td className="py-3">
                            <button onClick={() => toggleStatus(n.id, n.isActive)} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer ${n.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {n.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3 text-gray-500">{formatDate(new Date(n.createdAt))}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => openEdit(n)} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btnStyle("#2563EB")}>Edit</button>
                              <button onClick={() => handleDelete(n.id, n.name)} className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-semibold" style={btnStyle("#DC2626")}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={narrPage} totalPages={narrTotalPages} total={narrTotal} limit={LIMIT} onPageChange={setNarrPage} loading={loading} />
            </>
          )}

          {activeTab === "gallery" && (
            <div className="p-8 text-center text-[13px] text-gray-500">
              Gallery photos are managed within each narrative. Edit a narrative to add/remove photos.
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="p-8 text-center text-[13px] text-gray-500">
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
          show={show}
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
  show: (type: string, msg: string) => void; onSaved: () => void; inputClass: string;
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
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-brand-dark">{editingItem ? "Edit" : "Create"} Learner Narrative</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Age</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Country</label><input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Country Code</label><input type="text" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} className={inputClass} placeholder="🇰🇪" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Role</label><input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-gray-700">Cohort</label><input type="text" value={form.cohort} onChange={(e) => setForm({ ...form, cohort: e.target.value })} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Avatar URL</label><input type="text" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Cover Image URL</label><input type="text" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-gray-700">Headline Quote *</label><textarea value={form.headlineQuote} onChange={(e) => setForm({ ...form, headlineQuote: e.target.value })} className={`${inputClass} resize-none`} rows={2} /></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Impact Metric</label><input type="text" value={form.impactMetric} onChange={(e) => setForm({ ...form, impactMetric: e.target.value })} className={inputClass} placeholder="1,420" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Impact Label</label><input type="text" value={form.impactLabel} onChange={(e) => setForm({ ...form, impactLabel: e.target.value })} className={inputClass} placeholder="Households Connected" /></div>
        </div>
        <div className="mb-4"><label className="mb-1.5 block text-xs font-medium text-gray-700">Long Form Narrative (separate paragraphs with blank lines)</label><textarea value={form.longFormNarrative} onChange={(e) => setForm({ ...form, longFormNarrative: e.target.value })} className={`${inputClass} resize-none`} rows={4} /></div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Gallery Photos (JSON array)</label>
          <textarea value={form.galleryJson} onChange={(e) => setForm({ ...form, galleryJson: e.target.value })} className={`${inputClass} resize-none font-mono text-[11px]`} rows={4} placeholder='[{"url":"...","caption":"...","tag":"..."}]' />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Timeline Milestones (JSON array)</label>
          <textarea value={form.timelineJson} onChange={(e) => setForm({ ...form, timelineJson: e.target.value })} className={`${inputClass} resize-none font-mono text-[11px]`} rows={4} placeholder='[{"year":"2024","title":"...","description":"...","tag":"...","status":"completed"}]' />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className="mb-1.5 block text-xs font-medium text-gray-700">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className={inputClass} /></div>
          <div className="flex items-end"><div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" /><label htmlFor="isActive" className="text-xs font-medium text-gray-700">Active</label></div></div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-secondary disabled:opacity-50">
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
