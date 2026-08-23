"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  forceLocalLogout,
  getRestoredSessionUser,
  getToken,
  getUser,
  login as apiLogin,
  logoutSession as apiLogoutSession,
  type LoginPayload,
  refreshSession,
  register as apiRegister,
  type RegisterPayload,
} from "../lib/api";
import {
  hasAuthLogoutTombstone,
  markAuthSessionActive,
  subscribeToAuthSessionChanges,
  subscribeToUnauthorized,
} from "../lib/auth-session";
import { resolveBootstrapUser } from "../lib/auth-token";

type User = {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let localSessionRevision = 0;
    const unsubscribe = subscribeToUnauthorized(() => {
      void apiLogoutSession().catch(() => {
        if (!hasAuthLogoutTombstone()) forceLocalLogout("unauthorized_uncoordinated");
        setUser(null);
        setLoading(false);
      });
    });

    const unsubscribeFromAuthChanges = subscribeToAuthSessionChanges(() => {
      localSessionRevision += 1;
      const restoredUser = getRestoredSessionUser();
      if (restoredUser) markAuthSessionActive();
      setUser(restoredUser);
      setLoading(false);
    });

    void (async () => {
      const bootstrapRevision = localSessionRevision;
      const hasLogoutIntent = hasAuthLogoutTombstone();
      let token = hasLogoutIntent ? null : getToken();
      const cachedUser = hasLogoutIntent ? null : getUser();
      let restoredUser = hasLogoutIntent
        ? null
        : resolveBootstrapUser(token, cachedUser);

      if (!restoredUser && !hasLogoutIntent) {
        const refreshed = await refreshSession();
        token = refreshed?.token ?? null;
        const fallbackUser = refreshed
          ? {
              ...(cachedUser?.userId === refreshed.user_id ? cachedUser : {}),
              userId: refreshed.user_id,
            }
          : null;
        restoredUser = resolveBootstrapUser(token, fallbackUser);
      }

      if (cancelled || bootstrapRevision !== localSessionRevision) return;
      setUser(restoredUser);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeFromAuthChanges();
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const data = await apiLogin(payload);
        setUser(resolveBootstrapUser(data.token, getUser()));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const data = await apiRegister(payload);
        setUser(resolveBootstrapUser(data.token, getUser()));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void apiLogoutSession().catch(() => {
      if (!hasAuthLogoutTombstone()) forceLocalLogout();
      setUser(null);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
