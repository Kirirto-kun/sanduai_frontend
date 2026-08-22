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
  AuthResponse,
  clearToken,
  clearUser,
  decodeJWT,
  getToken,
  getUser,
  login as apiLogin,
  logoutSession as apiLogoutSession,
  type LoginPayload,
  refreshSession,
  register as apiRegister,
  type RegisterPayload,
  saveToken,
  saveUser,
  UserData,
} from "../lib/api";
import { subscribeToUnauthorized } from "../lib/auth-session";
import { resolveBootstrapUser } from "../lib/auth-token";
import { clearCachedBalance } from "../lib/tokenCache";

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
    const unsubscribe = subscribeToUnauthorized(() => {
      clearToken();
      clearUser();
      clearCachedBalance();
      setUser((currentUser) => (currentUser === null ? currentUser : null));
      setLoading(false);
      void apiLogoutSession();
    });

    void (async () => {
      let token = getToken();
      const cachedUser = getUser();
      let restoredUser = resolveBootstrapUser(token, cachedUser);

      if (!restoredUser) {
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

      if (cancelled) return;
      if (restoredUser) {
        saveUser(restoredUser);
        setUser(restoredUser);
      } else {
        clearToken();
        clearUser();
        clearCachedBalance();
        setUser(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleAuthSuccess = useCallback(
    (
      data: AuthResponse,
      extra?: { phone?: string; email?: string; full_name?: string },
    ) => {
      clearCachedBalance();
      saveToken(data.token);
      // Decode role from token
      const decoded = decodeJWT(data.token);
      const userData: UserData = {
        userId: data.user_id,
        phone: extra?.phone,
        email: extra?.email,
        fullName: extra?.full_name,
        role: decoded?.role,
      };
      saveUser(userData);
      setUser(userData);
    },
    [],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const data = await apiLogin(payload);
        handleAuthSuccess(data, { email: payload.email });
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const data = await apiRegister(payload);
        handleAuthSuccess(data, {
          phone: payload.phone,
          email: payload.email,
          full_name: payload.full_name,
        });
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    clearToken();
    clearUser();
    clearCachedBalance();
    setUser((currentUser) => (currentUser === null ? currentUser : null));
    void apiLogoutSession();
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
