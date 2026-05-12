"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
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
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateWishlistLocal: (productId: string, add: boolean) => void;
  addresses: Address[];
  setAddresses: (a: Address[]) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "naya_token";
const USER_KEY = "naya_user";
const GUEST_WISHLIST_KEY = "naya_guest_wishlist_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u) as User);
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
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAddresses([]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(res.token, res.user);
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

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiFetch<{ user: User & { addresses?: Address[] } }>(
          "/auth/me",
          { token },
        );
        if (cancelled) return;
        setUser(me.user);
        localStorage.setItem(USER_KEY, JSON.stringify(me.user));
        setAddresses(me.user.addresses ?? []);
      } catch {
        if (!cancelled) logout();
      }
    })();
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
      register,
      logout,
      refreshProfile,
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
      register,
      logout,
      refreshProfile,
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
