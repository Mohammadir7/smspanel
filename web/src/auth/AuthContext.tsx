import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { useTrace } from "../trace/TraceContext";

type User = { id: string; phone: string; name: string; role: string };

type AuthContextValue = {
  token: string | null;
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { logClient } = useTrace();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) {
      logClient("info", "auth", "نشست ذخیره‌شده بازیابی شد");
    }
  }, [token, logClient]);

  async function login(phone: string, password: string) {
    logClient("step", "auth", "در حال ورود…");
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      logClient("error", "auth", "ورود ناموفق", data.error, data.error);
      throw new Error(data.error ?? "خطا");
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    logClient("ok", "auth", "ورود موفق");
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logClient("info", "auth", "خروج از حساب");
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}
