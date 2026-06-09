"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search, Star, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminTableSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { useToast } from "@/components/admin/ui/AdminToast";

type ReviewUser = { _id: string; name?: string; email?: string };
type ReviewProduct = { _id: string; name?: string; slug?: string; images?: string[] };

type Review = {
  _id: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
  user?: ReviewUser;
  product?: ReviewProduct;
  createdAt: string;
};

type ReviewsResponse = {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
};

const STATUS_TONES: Record<string, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < value ? "text-amber-500" : "text-[var(--admin-border)]"}`}
          strokeWidth={1.25}
          fill={i < value ? "currentColor" : "transparent"}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const data = await apiFetch<ReviewsResponse>(
        `/reviews/admin/all?${params.toString()}`,
        { token },
      );
      setReviews(data.reviews);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, page]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function moderate(reviewId: string, status: "approved" | "rejected") {
    if (!token) return;
    try {
      await apiFetch(`/reviews/admin/${reviewId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      toast.success(status === "approved" ? "Review approved" : "Review rejected");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "Action failed");
    }
  }

  async function deleteReview(id: string) {
    if (!token) return;
    try {
      await apiFetch(`/reviews/admin/${id}`, { method: "DELETE", token });
      toast.success("Review deleted");
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "Delete failed");
    }
  }

  const pendingCount = useMemo(
    () => (statusFilter === "pending" ? total : null),
    [statusFilter, total],
  );

  return (
    <AdminPageLayout
      title="Reviews"
      description={
        pendingCount && pendingCount > 0
          ? `${pendingCount} pending moderation`
          : "Manage customer reviews"
      }
      toolbar={
        <div className="flex w-full items-center gap-3">
          <select
            className="admin-input w-auto shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      }
    >
      <AdminConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteReview(deleteTarget);
        }}
        title="Delete review?"
        description="This review will be permanently removed."
        confirmLabel="Delete"
      />

      {loading ? (
        <AdminTableSkeleton rows={5} cols={5} />
      ) : reviews.length === 0 ? (
        <AdminEmptyState
          title="No reviews found"
          description={
            statusFilter
              ? "No reviews match this filter."
              : "Reviews will appear here when customers submit them."
          }
        />
      ) : (
        <>
          <AdminCard padding="none" elevated>
            <AdminTable responsiveHide="sm">
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id}>
                      <td className="max-w-[10rem] truncate font-medium text-[var(--admin-ink)]">
                        {r.product?.name ?? "—"}
                      </td>
                      <td className="text-[var(--admin-muted)]">
                        {r.user?.name || r.user?.email || "Anonymous"}
                      </td>
                      <td>
                        <StarRating value={r.rating} />
                      </td>
                      <td className="max-w-[16rem] truncate text-[var(--admin-muted)]">
                        {r.body}
                      </td>
                      <td>
                        <AdminBadge tone={STATUS_TONES[r.status] ?? "neutral"} dot>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </AdminBadge>
                      </td>
                      <td className="whitespace-nowrap text-[var(--admin-muted)]">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status !== "approved" && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => void moderate(r._id, "approved")}
                              title="Approve"
                            >
                              <Check className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                            </AdminButton>
                          )}
                          {r.status !== "rejected" && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => void moderate(r._id, "rejected")}
                              title="Reject"
                            >
                              <X className="h-4 w-4 text-orange-600" strokeWidth={2} />
                            </AdminButton>
                          )}
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(r._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" strokeWidth={1.75} />
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTable>

            {/* Mobile card layout */}
            <div className="space-y-3 p-4 sm:hidden">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--admin-ink)]">
                        {r.product?.name ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {r.user?.name || r.user?.email || "Anonymous"}
                      </p>
                    </div>
                    <AdminBadge tone={STATUS_TONES[r.status] ?? "neutral"} dot>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </AdminBadge>
                  </div>
                  <div className="mt-2">
                    <StarRating value={r.rating} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--admin-muted)]">
                    {r.body}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {r.status !== "approved" && (
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => void moderate(r._id, "approved")}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} /> Approve
                      </AdminButton>
                    )}
                    {r.status !== "rejected" && (
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => void moderate(r._id, "rejected")}
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} /> Reject
                      </AdminButton>
                    )}
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(r._id)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" strokeWidth={1.75} />
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {totalPages > 1 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={50}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
