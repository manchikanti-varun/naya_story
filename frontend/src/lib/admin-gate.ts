const ADMIN_GATE_COOKIE = "naya_admin_gate";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

export function setAdminGateCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_GATE_COOKIE}=1; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearAdminGateCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_GATE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasAdminGateCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${ADMIN_GATE_COOKIE}=1`));
}

export { ADMIN_GATE_COOKIE };
