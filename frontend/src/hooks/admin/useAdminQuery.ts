"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type UseAdminQueryOptions = {
  /** Don't fetch on mount — wait for manual trigger */
  lazy?: boolean;
  /** Re-fetch when these deps change (in addition to endpoint/token) */
  deps?: unknown[];
};

type UseAdminQueryResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Shared data-fetching hook for admin pages.
 * Handles auth token, loading state, error state, and refresh.
 */
export function useAdminQuery<T>(
  endpoint: string,
  options: UseAdminQueryOptions = {},
): UseAdminQueryResult<T> {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.lazy);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(endpoint, { token });
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Request failed");
        setData(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token, endpoint]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!options.lazy) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, ...(options.deps ?? [])]);

  return { data, loading, error, refresh };
}
