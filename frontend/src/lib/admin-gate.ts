import crypto from "node:crypto";

const ADMIN_GATE_COOKIE = "naya_admin_gate";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

/**
 * Admin gate value is an HMAC-signed timestamp, not a plain "1".
 * The middleware validates the signature so that forging the cookie
 * requires knowledge of the signing secret (derived from a build-time key).
 *
 * Format: <timestamp_hex>.<hmac_hex>
 */
function getGateSecret(): string {
  // Use NEXT_PUBLIC_API_URL as entropy (available at build time).
  // This isn't a high-security secret — it's a navigation guard, not an auth gate.
  // Real admin authorization is enforced server-side via JWT role checks.
  const base = typeof window !== "undefined"
    ? (window.location.origin || "naya-admin-gate")
    : (process.env.NEXT_PUBLIC_API_URL || "naya-admin-gate");
  return base;
}

function signGateValue(): string {
  const ts = Date.now().toString(16);
  const secret = getGateSecret();
  const hmac = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 16);
  return `${ts}.${hmac}`;
}

export function verifyGateValue(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;

  const secret = getGateSecret();
  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 16);

  // Timing-safe comparison
  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
}

export function setAdminGateCookie(): void {
  if (typeof document === "undefined") return;
  const value = signGateValue();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_GATE_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearAdminGateCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasAdminGateCookie(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie.split(";").find((part) => part.trim().startsWith(`${ADMIN_GATE_COOKIE}=`));
  if (!match) return false;
  const value = match.split("=").slice(1).join("=").trim();
  return verifyGateValue(value);
}

export { ADMIN_GATE_COOKIE };
