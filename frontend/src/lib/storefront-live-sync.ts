/** Cross-tab signal so the storefront refetches CMS + theme without a manual hard refresh. */
export const STOREFRONT_SETTINGS_CHANNEL = "naya-storefront-settings";
const STORAGE_REV_KEY = "naya_store_rev";

export function publishStorefrontSettingsChanged(): void {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel(STOREFRONT_SETTINGS_CHANNEL);
    bc.postMessage({ type: "invalidate", t: Date.now() });
    bc.close();
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(STORAGE_REV_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
