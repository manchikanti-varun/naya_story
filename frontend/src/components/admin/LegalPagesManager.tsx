"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { legalPageHref, type LegalPage } from "@/types/legal-page";

type Draft = {
  title: string;
  slug: string;
  body: string;
  order: number;
  published: boolean;
};

const emptyDraft = (): Draft => ({
  title: "",
  slug: "",
  body: "",
  order: 0,
  published: true,
});

function slugPreview(title: string, slug: string) {
  const s = slug.trim() || title.trim().toLowerCase().replace(/&/g, " and ").replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-");
  return s || "page";
}

export function LegalPagesManager() {
  const { token } = useAuth();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch<{ pages: LegalPage[] }>("/legal-pages", { token });
    setPages(data.pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)));
  }, [token]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch {
        setPages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const previewPath = useMemo(
    () => legalPageHref(slugPreview(draft.title, draft.slug)),
    [draft.title, draft.slug],
  );

  function startCreate() {
    setEditingId(null);
    setDraft({ ...emptyDraft(), order: pages.length });
    setError(null);
  }

  function startEdit(page: LegalPage) {
    setEditingId(page.id);
    setDraft({
      title: page.title,
      slug: page.slug,
      body: page.body,
      order: page.order,
      published: page.published,
    });
    setError(null);
  }

  async function savePage(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: draft.title.trim(),
        body: draft.body,
        slug: draft.slug.trim() || undefined,
        order: draft.order,
        published: draft.published,
      };
      if (editingId) {
        await apiFetch(`/legal-pages/${editingId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/legal-pages", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }
      await refresh();
      if (!editingId) startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save page.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id: string, title: string) {
    if (!token) return;
    if (!window.confirm(`Delete “${title}”? This removes the page and its URL.`)) return;
    try {
      await apiFetch(`/legal-pages/${id}`, { method: "DELETE", token });
      if (editingId === id) startCreate();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete page.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">
              {editingId ? "Edit legal page" : "Add legal page"}
            </h2>
            <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">
              Each page gets its own URL under{" "}
              <code className="font-mono text-[12px]">/policies/your-slug</code> and appears in the
              footer automatically.
            </p>
          </div>
          {editingId ? (
            <AdminButton type="button" variant="ghost" size="sm" onClick={startCreate}>
              New page
            </AdminButton>
          ) : null}
        </div>

        <form className="mt-6 space-y-4" onSubmit={savePage}>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="Page name">
              <AdminInput
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Privacy Policy"
                required
              />
            </AdminField>
            <AdminField
              label="URL slug"
              hint="Leave blank to auto-generate from the page name."
            >
              <AdminInput
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="privacy-policy"
              />
            </AdminField>
          </div>

          <p className="font-sans text-xs text-[var(--admin-muted)]">
            Live route:{" "}
            <Link href={previewPath} target="_blank" className="text-[var(--admin-accent)] hover:underline">
              {previewPath}
            </Link>
          </p>

          <AdminField label="Page content">
            <RichTextEditor
              content={draft.body}
              onChange={(html) => setDraft({ ...draft, body: html })}
              placeholder="Write your policy content here…"
            />
          </AdminField>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminField label="Sort order">
              <AdminInput
                type="number"
                min={0}
                value={draft.order}
                onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
              />
            </AdminField>
            <AdminField label="Visibility">
              <label className="mt-2 flex items-center gap-2 font-sans text-sm text-[var(--admin-ink)]">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                  className="rounded border-[var(--admin-border)]"
                />
                Published (visible on storefront & sitemap)
              </label>
            </AdminField>
          </div>

          {error ? <p className="font-sans text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update page" : "Create page"}
            </AdminButton>
            {editingId ? (
              <AdminButton type="button" variant="secondary" onClick={startCreate}>
                Cancel
              </AdminButton>
            ) : null}
          </div>
        </form>
      </AdminCard>

      <AdminCard padding="none" elevated>
        {loading ? (
          <p className="p-8 font-sans text-sm text-[var(--admin-muted)]">Loading pages…</p>
        ) : pages.length === 0 ? (
          <AdminEmptyState
            title="No legal pages yet"
            description="Create Terms, Privacy, Refund, and Shipping pages — or any custom policy page you need."
          />
        ) : (
          <AdminTable>
            <table className="admin-table text-sm">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Route</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td className="font-medium text-[var(--admin-ink)]">{page.title}</td>
                    <td>
                      <Link
                        href={legalPageHref(page.slug)}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[var(--admin-accent)] hover:underline"
                      >
                        {legalPageHref(page.slug)}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                    <td>{page.order}</td>
                    <td>
                      <AdminBadge tone={page.published ? "success" : "neutral"}>
                        {page.published ? "Published" : "Draft"}
                      </AdminBadge>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <AdminButton type="button" size="sm" variant="secondary" onClick={() => startEdit(page)}>
                          Edit
                        </AdminButton>
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => void deletePage(page.id, page.title)}
                          aria-label={`Delete ${page.title}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}
      </AdminCard>
    </div>
  );
}
