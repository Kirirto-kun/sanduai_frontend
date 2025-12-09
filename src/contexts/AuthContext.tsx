"use client";

import {
  createContext,
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
  getToken,
  getUser,
  login as apiLogin,
  register as apiRegister,
  saveToken,
  saveUser,
  UserData,
} from "../lib/api";

type User = {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  register: (payload: {
    phone: string;
    email: string;
    password: string;
    full_name: string;
  }) => Promise<void>;
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
    const token = getToken();
    if (token) {
      const userData = getUser();
      if (userData) {
        setUser(userData);
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (
    data: AuthResponse,
    extra?: { phone?: string; email?: string; full_name?: string },
  ) => {
    saveToken(data.token);
    const userData: UserData = {
      userId: data.user_id,
      phone: extra?.phone,
      email: extra?.email,
      fullName: extra?.full_name,
    };
    saveUser(userData);
    setUser(userData);
  };

  const login = async (payload: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const data = await apiLogin(payload);
      handleAuthSuccess(data, { phone: payload.phone });
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    phone: string;
    email: string;
    password: string;
    full_name: string;
  }) => {
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
  };

  const logout = () => {
    clearToken();
    clearUser();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      loading,
      login,
      register,
      logout,
    }),
    [user, loading],
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


