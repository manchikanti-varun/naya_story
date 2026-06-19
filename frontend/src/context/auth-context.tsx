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

/**
 * User profile is stored in localStorage for hydration on reload.
 * The JWT access token is kept in MEMORY ONLY — never persisted to storage.
 * This eliminates the XSS → token theft attack vector.
 * On page reload, the token is restored via the httpOnly refresh cookie (/auth/refresh).
 */
const USER_KEY = "naya_user";
const GUEST_WISHLIST_KEY = "naya_guest_wishlist_v1";

/**
 * Cross-tab synchronization key. When another tab logs in/out, this tab
 * picks up the change via the `storage` event (no redundant API calls).
 */
const SYNC_EVENT_KEY = "naya_auth_sync";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Token is stored ONLY in memory — never written to localStorage
  const [token, setToken] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Deduplication: prevent parallel refresh/me calls across re-renders
  const profileFetchRef = useRef<Promise<void> | null>(null);
  const hasFetchedProfile = useRef(false);

  // Hydrate user profile from localStorage (for immediate UI), then refresh token
  useEffect(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) {
        const parsed = JSON.parse(u) as User;
        setUser(parsed);
        if (parsed.role === "admin") setAdminGateCookie();
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

  /**
   * Persist user profile (NOT the token) and set in-memory token.
   */
  const persist = useCallback(async (t: string, u: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    // Notify other tabs of login
    localStorage.setItem(SYNC_EVENT_KEY, `login:${Date.now()}`);
    setToken(t);
    setUser(u);
    if (u.role === "admin") await setAdminGateCookie();
    else clearAdminGateCookie();
  }, []);

  const logout = useCallback(async () => {
    // Call backend to clear httpOnly cookie
    try {
      await apiFetch("/auth/logout", { method: "POST", token });
    } catch {
      /* best effort */
    }
    localStorage.removeItem(USER_KEY);
    // Notify other tabs
    localStorage.setItem(SYNC_EVENT_KEY, `logout:${Date.now()}`);
    clearAdminGateCookie();
    setToken(null);
    setUser(null);
    setAddresses([]);
    hasFetchedProfile.current = false;
  }, [token]);

  /**
   * Silent token refresh using httpOnly cookie.
   * Called on page load and when a 401 is received.
   */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await apiFetch<{ token: string; user: User }>("/auth/refresh", {
        method: "POST",
      });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      if (res.user.role === "admin") setAdminGateCookie();
      else clearAdminGateCookie();
      hasFetchedProfile.current = true;
      return res.token;
    } catch {
      // Refresh failed — user is logged out
      localStorage.removeItem(USER_KEY);
      clearAdminGateCookie();
      setToken(null);
      setUser(null);
      setAddresses([]);
      return null;
    }
  }, []);

  // On mount: if we have a cached user (suggesting a prior session), attempt silent refresh
  useEffect(() => {
    const cachedUser = localStorage.getItem(USER_KEY);
    if (!cachedUser) return;
    if (hasFetchedProfile.current) return;
    if (profileFetchRef.current) return;

    let cancelled = false;
    const fetchPromise = (async () => {
      try {
        const newToken = await silentRefresh();
        if (cancelled || !newToken) return;

        // Fetch full profile with addresses
        const me = await apiFetch<{ user: User & { addresses?: Address[] } }>(
          "/auth/me",
          { token: newToken },
        );
        if (cancelled) return;
        setUser(me.user);
        localStorage.setItem(USER_KEY, JSON.stringify(me.user));
        setAddresses(me.user.addresses ?? []);
        hasFetchedProfile.current = true;
      } catch {
        if (!cancelled) {
          localStorage.removeItem(USER_KEY);
          clearAdminGateCookie();
          setToken(null);
          setUser(null);
        }
      } finally {
        profileFetchRef.current = null;
      }
    })();

    profileFetchRef.current = fetchPromise;
    return () => {
      cancelled = true;
    };
  }, [silentRefresh]);

  // Sync state when another tab writes to localStorage
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === SYNC_EVENT_KEY) {
        if (e.newValue?.startsWith("logout")) {
          setToken(null);
          setUser(null);
          setAddresses([]);
          clearAdminGateCookie();
        } else if (e.newValue?.startsWith("login")) {
          // Another tab logged in — attempt silent refresh in this tab
          void silentRefresh();
        }
      }
      if (e.key === USER_KEY && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue) as User);
        } catch { /* ignore */ }
      }
      if (e.key === USER_KEY && !e.newValue) {
        setToken(null);
        setUser(null);
        setAddresses([]);
        clearAdminGateCookie();
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [silentRefresh]);

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
