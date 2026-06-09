"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminTableSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { useToast } from "@/components/admin/ui/AdminToast";

type Coupon = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
};

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: 10,
    usageLimit: 500,
  });

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ coupons: Coupon[] }>("/coupons", { token });
      setCoupons(data.coupons);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCoupon(id: string) {
    if (!token) return;
    await apiFetch(`/coupons/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Coupon deleted");
    setDeleteTarget(null);
    await refresh();
  }

  useEffect(() => {
    void refresh().catch(() => setCoupons([]));
  }, [token]);

  return (
    <AdminPageLayout
      title="Coupons"
      description="Discount codes for checkout."
    >
      <AdminCard padding="md">
        <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Create coupon</h2>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!token) return;
            await apiFetch("/coupons", {
              method: "POST",
              token,
              body: JSON.stringify(draft),
            });
            publishStorefrontSettingsChanged();
            toast.success(`Coupon ${draft.code} created`);
            setDraft({ code: "", type: "percent", value: 10, usageLimit: 500 });
            await refresh();
          }}
        >
          <AdminField label="Code">
            <AdminInput
              placeholder="SUMMER20"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              className="uppercase"
              required
            />
          </AdminField>
          <AdminField label="Type">
            <AdminSelect
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as "percent" | "fixed" })}
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed ₹ off</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Value">
            <AdminInput
              type="number"
              min={0}
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
            />
          </AdminField>
          <AdminButton type="submit" variant="primary" className="w-full lg:w-auto">
            Create
          </AdminButton>
        </form>
      </AdminCard>

      <AdminConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteCoupon(deleteTarget); }}
        title="Delete coupon?"
        description="This coupon code will be permanently removed and can no longer be used at checkout."
        confirmLabel="Delete"
      />

      {loading ? (
        <AdminTableSkeleton rows={3} cols={5} />
      ) : (
      <AdminCard padding="none" elevated>
        <AdminTable>
          <table className="admin-table text-sm">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--admin-muted)]">
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="font-medium">{c.code}</td>
                    <td className="capitalize text-[var(--admin-muted)]">{c.type}</td>
                    <td className="tabular-nums text-[var(--admin-muted)]">
                      {c.type === "percent" ? `${c.value}%` : `₹${c.value}`}
                    </td>
                    <td className="tabular-nums text-[var(--admin-muted)]">
                      {c.usedCount}/{c.usageLimit ?? "∞"}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <AdminBadge tone={c.active ? "success" : "neutral"}>
                          {c.active ? "Active" : "Inactive"}
                        </AdminBadge>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!token) return;
                            await apiFetch(`/coupons/${c._id}`, {
                              method: "PATCH",
                              token,
                              body: JSON.stringify({ active: !c.active }),
                            });
                            publishStorefrontSettingsChanged();
                            toast.success(c.active ? "Coupon deactivated" : "Coupon activated");
                            await refresh();
                          }}
                        >
                          {c.active ? "Deactivate" : "Activate"}
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(c._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTable>
      </AdminCard>
      )}
    </AdminPageLayout>
  );
}
