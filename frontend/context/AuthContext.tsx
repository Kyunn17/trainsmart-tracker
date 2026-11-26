"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/workout";
import { 
  apiLogin, 
  apiRegister, 
  apiGetMe, 
  apiLogout, 
  selectPersonalTrainer,
  setAuthToken 
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string; errors?: unknown; user?: User }>;
  logout: () => Promise<void>;
  chooseTrainer: (trainerId: number | null) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const me = await apiGetMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiLogin({ email, password: pass });
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message, user: res.user };
    }
    return { success: false, message: res.message || "Login gagal" };
  };

  const register = async (payload: Record<string, unknown>) => {
    const res = await apiRegister(payload as Parameters<typeof apiRegister>[0]);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message, user: res.user };
    }
    return { success: false, message: res.message || "Registrasi gagal", errors: res.errors };
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    router.push("/login");
  };

  const chooseTrainer = async (trainerId: number | null) => {
    const res = await selectPersonalTrainer(trainerId);
    if (res.success) {
      await refreshUser();
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        chooseTrainer,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
