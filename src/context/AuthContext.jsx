"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  API_URL,
  clearSession,
  getToken,
  getUser,
  setSession,
} from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getToken());
    setUser(getUser());
    setLoading(false);
  }, []);

  const applySession = (data) => {
    setSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const loginWithOtp = async (phone, otp) => {
    const res = await fetch(`${API_URL}/api/auth/login/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return applySession(data);
  };

  const loginAdmin = async (password) => {
    const res = await fetch(`${API_URL}/api/auth/login/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return applySession(data);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    } catch {
      // client-side clear is enough for JWT
    }
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token),
        loginWithOtp,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
