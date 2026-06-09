/**
 * Order status state machine.
 * Defines valid transitions and provides validation.
 */

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

/** Map of current status → allowed next statuses */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * Check whether a status transition is valid.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Validate a transition and return an error message if invalid, or null if valid.
 */
export function validateTransition(from: OrderStatus, to: OrderStatus): string | null {
  if (!ALLOWED_TRANSITIONS[from]) {
    return `Unknown current status: ${from}`;
  }
  if (!Object.keys(ALLOWED_TRANSITIONS).includes(to)) {
    return `Unknown target status: ${to}`;
  }
  if (!isValidTransition(from, to)) {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (allowed.length === 0) {
      return `Order with status "${from}" cannot be transitioned further.`;
    }
    return `Cannot transition from "${from}" to "${to}". Allowed transitions: ${allowed.join(", ")}.`;
  }
  return null;
}

/**
 * Returns allowed next statuses for a given current status.
 */
export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}
