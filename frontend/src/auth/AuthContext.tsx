//  frontend/src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../types";
import { getMe, logout as apiLogout } from "./auth.api";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthed: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = async () => {
    setIsLoading(true);
    const res = await getMe();
    if (res.ok) setUser(res.data as User);
    else setUser(null);
    setIsLoading(false);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    void refreshMe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthed: !!user,
      refreshMe,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
