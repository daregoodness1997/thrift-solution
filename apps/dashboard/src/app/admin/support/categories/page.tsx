"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button } from "@thrift/ui";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import type { TicketCategory } from "@thrift/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    position: 0,
  });
  const [editing, setEditing] = useState<TicketCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/support/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      slug: "",
      position: categories.length,
    });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (c: TicketCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      slug: c.slug,
      position: c.position,
    });
    setError(null);
    setShowForm(true);
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || slugify(form.name);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editing
        ? `${API_URL}/api/support/admin/categories/${editing.id}`
        : `${API_URL}/api/support/admin/categories`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, slug }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        showMessage(
          "success",
          editing ? "Category updated" : "Category created",
        );
        fetchCategories();
      } else {
        setError(data.error || "Failed to save category");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: TicketCategory) => {
    try {
      const res = await fetch(
        `${API_URL}/api/support/admin/categories/${c.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !c.isActive }),
        },
      );
      const data = await res.json();
      if (data.success) fetchCategories();
    } catch {}
  };

  const remove = async (c: TicketCategory) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      const res = await fetch(
        `${API_URL}/api/support/admin/categories/${c.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) fetchCategories();
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Support"
        badgeColor="#2563EB"
        heading="Ticket"
        accentText="Categories"
        description="Organize tickets into categories for faster routing."
        right={
          !showForm && (
            <Button onClick={openCreate}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>{" "}
              New Category
            </Button>
          )
        }
      />

      <div className="mx-auto max-w-[1280px] p-[clamp(1rem,3vw,2rem)]">
        {message && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-xs ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}
          >
            {message.text}
          </div>
        )}

        {showForm && (
          <Card className="mb-6 p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Payments"
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto from name"
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional description"
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Position
                </label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      position: parseInt(e.target.value) || 0,
                    })
                  }
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>
              {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Category"}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-slate-400">No categories yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((c) => (
              <Card
                key={c.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </span>
                    {!c.isActive && (
                      <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {c.slug}
                    {c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(c)}
                  >
                    {c.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
