const ADMIN_GATE_COOKIE = "naya_admin_gate";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

/**
 * Admin gate value is an HMAC-signed timestamp.
 * The middleware validates the signature so that forging the cookie
 * requires knowledge of the signing secret.
 *
 * Secret strategy:
 *   - Server-side (Edge middleware): uses ADMIN_GATE_SECRET env var (server-only, not NEXT_PUBLIC_).
 *   - Client-side (cookie setting): uses NEXT_PUBLIC_ADMIN_GATE_SECRET (must match server secret).
 *     If not set, falls back to a combination of origin + a static salt.
 *
 * Format: <timestamp_hex>.<hmac_hex_16>
 */
function getGateSecret(): string {
  // Use dedicated env var if available, otherwise use a shared fallback.
  // Both client (cookie signing) and server (Edge middleware verification) 
  // must resolve to the same value.
  const envSecret = process.env.NEXT_PUBLIC_ADMIN_GATE_SECRET || process.env.ADMIN_GATE_SECRET;
  if (envSecret) return envSecret;
  // Fallback: deterministic value both sides agree on
  return "naya-admin-gate-v2-default";
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

async function signGateValue(): Promise<string> {
  const ts = Date.now().toString(16);
  const secret = getGateSecret();
  const hmac = await hmacSign(secret, ts);
  return `${ts}.${hmac}`;
}

export function verifyGateValue(value: string | undefined): boolean {
  // Synchronous check: just verify format. The real HMAC verification
  // happens in the middleware (Edge) which is async.
  // Client-side we only check that the cookie exists and has the right format.
  if (!value || !value.includes(".")) return false;
  const [ts, sig] = value.split(".");
  if (!ts || !sig) return false;
  // Check timestamp is a valid hex and signature is 16 chars
  if (!/^[0-9a-f]+$/.test(ts) || sig.length !== 16) return false;
  return true;
}

export function setAdminGateCookie(): void {
  if (typeof document === "undefined") return;
  void signGateValue().then((value) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ADMIN_GATE_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
  });
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
