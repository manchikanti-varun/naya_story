"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { clearAdminGateCookie, setAdminGateCookie } from "@/lib/admin-gate";
import type { Address, User } from "@/types";

type AuthResponse = {
  token: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  wishlistIds: string[];
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  /** After Google OAuth redirect (`?token=`), load profile and persist session. */
  finishOAuthLogin: (accessToken: string) => Promise<User>;
  updateWishlistLocal: (productId: string, add: boolean) => void;
  addresses: Address[];
  setAddresses: (a: Address[]) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "naya_token";
const USER_KEY = "naya_user";
const GUEST_WISHLIST_KEY = "naya_guest_wishlist_v1";

/**
 * Cross-tab synchronization key. When another tab logs in/out, this tab
 * picks up the change via the `storage` event (no redundant API calls).
 */
const SYNC_EVENT_KEY = "naya_auth_sync";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Deduplication: prevent parallel /me calls across re-renders
  const profileFetchRef = useRef<Promise<void> | null>(null);
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      if (t) {
        setToken(t);
        if (u) {
          const parsed = JSON.parse(u) as User;
          setUser(parsed);
          if (parsed.role === "admin") setAdminGateCookie();
        }
      }
      const gw = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (gw) {
        const parsed = JSON.parse(gw) as string[];
        setGuestWishlist(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const persist = useCallback((t: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    // Notify other tabs
    localStorage.setItem(SYNC_EVENT_KEY, `login:${Date.now()}`);
    setToken(t);
    setUser(u);
    if (u.role === "admin") setAdminGateCookie();
    else clearAdminGateCookie();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Notify other tabs
    localStorage.setItem(SYNC_EVENT_KEY, `logout:${Date.now()}`);
    clearAdminGateCookie();
    setToken(null);
    setUser(null);
    setAddresses([]);
    hasFetchedProfile.current = false;
  }, []);

  // Sync state when another tab writes to localStorage
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          // Another tab logged out
          setToken(null);
          setUser(null);
          setAddresses([]);
          clearAdminGateCookie();
        } else {
          // Another tab logged in
          setToken(e.newValue);
          try {
            const raw = localStorage.getItem(USER_KEY);
            if (raw) setUser(JSON.parse(raw) as User);
          } catch { /* ignore */ }
        }
      }
      if (e.key === USER_KEY && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue) as User);
        } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(res.token, res.user);
      hasFetchedProfile.current = true;
      return res.user;
    },
    [persist],
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(res.token, res.user);
      hasFetchedProfile.current = true;
      return res.user;
    },
    [persist],
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      const res = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      persist(res.token, res.user);
      hasFetchedProfile.current = true;
    },
    [persist],
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const me = await apiFetch<{ user: User & { addresses?: Address[] } }>(
      "/auth/me",
      { token },
    );
    setUser(me.user);
    localStorage.setItem(USER_KEY, JSON.stringify(me.user));
    if (me.user && "addresses" in me.user && me.user.addresses) {
      setAddresses(me.user.addresses as Address[]);
    }
  }, [token]);

  const finishOAuthLogin = useCallback(
    async (accessToken: string) => {
      const me = await apiFetch<{ user: User & { addresses?: Address[] } }>(
        "/auth/me",
        { token: accessToken },
      );
      persist(accessToken, me.user);
      if (me.user.addresses) setAddresses(me.user.addresses as Address[]);
      hasFetchedProfile.current = true;
      return me.user;
    },
    [persist],
  );

  const updateWishlistLocal = useCallback((productId: string, add: boolean) => {
    if (token) {
      setUser((prev) => {
        if (!prev) return prev;
        const list = new Set(prev.wishlist ?? []);
        if (add) list.add(productId);
        else list.delete(productId);
        const next = { ...prev, wishlist: [...list] };
        localStorage.setItem(USER_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    setGuestWishlist((prev) => {
      const list = new Set(prev);
      if (add) list.add(productId);
      else list.delete(productId);
      const next = [...list];
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, [token]);

  const wishlistIds = useMemo(
    () => (token ? (user?.wishlist ?? []) : guestWishlist),
    [token, user?.wishlist, guestWishlist],
  );

  // Fetch profile once on mount (deduplicated across renders and parallel tabs)
  useEffect(() => {
    if (!token) return;
    // Skip if we already fetched during this session (login/register already gave us fresh data)
    if (hasFetchedProfile.current) return;
    // Deduplicate: if a fetch is already in progress, don't start another
    if (profileFetchRef.current) return;

    let cancelled = false;
    const fetchPromise = (async () => {
      try {
        const me = await apiFetch<{ user: User & { addresses?: Address[] } }>(
          "/auth/me",
          { token },
        );
        if (cancelled) return;
        setUser(me.user);
        localStorage.setItem(USER_KEY, JSON.stringify(me.user));
        setAddresses(me.user.addresses ?? []);
        if (me.user.role === "admin") setAdminGateCookie();
        else clearAdminGateCookie();
        hasFetchedProfile.current = true;
      } catch {
        if (!cancelled) logout();
      } finally {
        profileFetchRef.current = null;
      }
    })();

    profileFetchRef.current = fetchPromise;
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      wishlistIds,
      login,
      adminLogin,
      register,
      logout,
      refreshProfile,
      finishOAuthLogin,
      updateWishlistLocal,
      addresses,
      setAddresses,
    }),
    [
      user,
      token,
      loading,
      wishlistIds,
      login,
      adminLogin,
      register,
      logout,
      refreshProfile,
      finishOAuthLogin,
      updateWishlistLocal,
      addresses,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
