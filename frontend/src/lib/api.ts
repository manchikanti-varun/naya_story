const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export const API_BASE = `${API_ORIGIN}/api`;

export const googleAuthUrl = `${API_ORIGIN}/api/auth/google`;

export type ApiErrorBody = { message?: string; errors?: unknown };

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function authHeaders(token?: string | null): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    // CSRF protection: custom header that cannot be set cross-origin without CORS preflight
    "X-Requested-With": "XMLHttpRequest",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...authHeaders(token),
      ...(headers as Record<string, string>),
    },
    cache: rest.cache ?? "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const body = (typeof data === "object" && data !== null ? data : {}) as ApiErrorBody;
    throw new ApiError(
      body.message ?? `Request failed (${res.status})`,
      res.status,
      body,
    );
  }

  return data as T;
}
