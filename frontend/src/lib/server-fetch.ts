const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

function isConnectionRefused(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const cause = err.cause as { code?: string } | undefined;
  if (cause?.code === "ECONNREFUSED") return true;
  return String(err.message).includes("fetch failed");
}

/**
 * Server-side fetch to the Naya API. In development, retries while the API
 * is still starting (MongoDB connect + Express listen).
 */
export async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const isDev = process.env.NODE_ENV === "development";
  const maxAttempts = isDev ? 12 : 1;
  const delayMs = 500;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(url, { cache: "no-store", ...init });
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
