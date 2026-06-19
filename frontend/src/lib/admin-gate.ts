const ADMIN_GATE_COOKIE = "naya_admin_gate";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

/**
 * Admin gate cookie — simple navigation guard for /admin routes.
 * Real security is enforced by the API via JWT on every request.
 *
 * Format: <timestamp_hex>.<signature_hex_16>
 * The middleware checks format + timestamp freshness (not HMAC).
 */

function generateGateValue(): string {
  const ts = Date.now().toString(16);
  // Generate a random 16-char hex signature
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const sig = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ts}.${sig}`;
}

export function verifyGateValue(value: string | undefined): boolean {
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;
  if (!/^[0-9a-f]+$/i.test(ts) || sig.length !== 16) return false;
  return true;
}

export async function setAdminGateCookie(): Promise<void> {
  if (typeof document === "undefined") return;
  const value = generateGateValue();
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
