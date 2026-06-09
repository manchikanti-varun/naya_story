/**
 * Analytics service — admin dashboard data aggregation.
 * All methods use graceful degradation: non-critical data failures
 * return safe defaults instead of crashing the entire request.
 */
import mongoose from "mongoose";
import { orderRepository } from "../repositories/order.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { settingsRepository } from "../repositories/settings.repository.js";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { loadPdpSuggestedProducts } from "../lib/pdp-suggestions.js";
import type { HomepageConfig } from "../types/homepage.js";

/** Safely resolve a promise, returning a fallback on failure. */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export const analyticsService = {
  async getDashboardOverview() {
    const [revenue, ordersCount, customersCount, topProducts, lowStock, outOfStockCount, recentOrders, pendingOrdersCount] = await Promise.all([
      safe(orderRepository.aggregateRevenue(), 0),
      safe(orderRepository.countAll(), 0),
      safe(userRepository.countCustomers(), 0),
      safe(orderRepository.aggregateTopProducts(5), []),
      safe(productRepository.findLowStock(5, 10), []),
      safe(productRepository.countOutOfStock(), 0),
      safe(orderRepository.findRecent(8), []),
      safe(orderRepository.countByStatuses(["pending", "confirmed", "packed"]), 0),
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesTrend = await safe(orderRepository.aggregateSalesTrend(thirtyDaysAgo), []);

    return {
      revenue,
      ordersCount,
      customersCount,
      pendingOrdersCount,
      topProducts,
      lowStock,
      outOfStockCount,
      recentOrders,
      salesTrend,
    };
  },

  async getCustomersReport() {
    const customers = await userRepository.findCustomers(500) as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      createdAt?: Date;
    }>;
    const userIds = customers.map((c) => c._id);

    const [byUser, byGuestEmail] = await Promise.all([
      safe(orderRepository.aggregateByUser(userIds), []),
      safe(orderRepository.aggregateByGuestEmail(), []),
    ]);

    const userMap = new Map(byUser.map((s) => [String(s._id), s]));
    const emailMap = new Map(byGuestEmail.map((s) => [s._id, s]));
    const registeredEmails = new Set(customers.map((c) => c.email.toLowerCase()));

    const enriched = customers.map((c) => {
      const u = userMap.get(String(c._id));
      const e = emailMap.get(c.email.toLowerCase());
      const orderCount = (u?.orderCount ?? 0) + (e?.orderCount ?? 0);
      const totalSpent = (u?.totalSpent ?? 0) + (e?.totalSpent ?? 0);
      const lastOrderAt = [u?.lastOrderAt, e?.lastOrderAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
      return { ...c, orderCount, totalSpent, lastOrderAt: lastOrderAt ?? null };
    });

    const guestBuyers = byGuestEmail
      .filter((g) => !registeredEmails.has(g._id))
      .map((g) => ({
        email: g._id,
        orderCount: g.orderCount,
        totalSpent: g.totalSpent,
        lastOrderAt: g.lastOrderAt,
      }))
      .sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime())
      .slice(0, 100);

    const withOrders = enriched.filter((c) => c.orderCount > 0).length;

    return {
      customers: enriched,
      guestBuyers,
      summary: {
        registered: customers.length,
        withOrders,
        guestOnly: guestBuyers.length,
      },
    };
  },

  async getAdminProductPreview(slug: string) {
    const raw = await productRepository.findBySlugLean(slug);
    if (!raw) return null;

    let storefront = mergeStorefrontSettings(undefined);
    let suggested: { mode: string; label: string; products: Record<string, unknown>[] } = {
      mode: "auto",
      label: "Suggested for you",
      products: [],
    };

    try {
      const settingsDoc = await settingsRepository.findOne();
      const homepage = mergeHomepageConfig((settingsDoc?.homepage ?? {}) as Partial<HomepageConfig>);
      storefront = mergeStorefrontSettings(settingsDoc?.storefront);
      suggested = await loadPdpSuggestedProducts(
        raw as unknown as { _id: mongoose.Types.ObjectId; category: string; collection?: string },
        storefront.pdpSuggestedMode ?? "auto",
        homepage,
      );
    } catch {
      // Non-critical: product still loads without suggestions
    }

    return {
      product: raw,
      related: suggested.products,
      suggested: { mode: suggested.mode, label: suggested.label, products: suggested.products },
      storefront,
    };
  },
};
