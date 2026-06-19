const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

function isConnectionRefused(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const cause = err.cause as { code?: string } | undefined;
  if (cause?.code === "ECONNREFUSED") return true;
  return String(err.message).includes("fetch failed");
}

/**
 * Default revalidation time for server-side fetches (in seconds).
 * Enables ISR: pages are statically generated, then revalidated in the background.
 *
 * - 60s for product/content pages: fresh enough for catalog, reduces API load by ~99%
 * - Use `{ next: { revalidate: 0 } }` or `cache: "no-store"` for user-specific data
 */
const DEFAULT_REVALIDATE_SECONDS = 60;

/**
 * Server-side fetch to the Naya API with ISR support.
 *
 * By default, responses are cached and revalidated every 60 seconds (ISR).
 * This reduces API load from 10K+ visitors hitting MongoDB directly to
 * at most 1 request per minute per unique URL.
 *
 * Override with:
 *   fetchApi("/api/orders/mine", { cache: "no-store" }) — for user-specific data
 *   fetchApi("/api/products", { next: { revalidate: 300 } }) — for slower-changing data
 */
export async function fetchApi(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } },
): Promise<Response> {
  const url = `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const isDev = process.env.NODE_ENV === "development";
  const maxAttempts = isDev ? 12 : 1;
  const delayMs = 500;

  // Apply ISR by default unless caller specifies cache behavior
  const hasExplicitCache = init?.cache !== undefined || init?.next !== undefined;
  const fetchInit: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    ...init,
    ...(hasExplicitCache
      ? {}
      : { next: { revalidate: DEFAULT_REVALIDATE_SECONDS } }),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(url, fetchInit as RequestInit);
    } catch (err) {
      lastError = err;
      if (!isDev || !isConnectionRefused(err) || attempt === maxAttempts - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export { API_ORIGIN };
