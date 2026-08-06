"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  API_URL,
  clearSession,
  getToken,
  getUser,
  setSession,
} from "@/lib/auth";
import { loginPassword as loginPasswordApi } from "@/lib/loginApi";

const AuthContext = createContext(null);

function normalizeSessionUser(data) {
  const user = data?.user || {};
  return {
    ...user,
    id: user.id || user._id,
    passwordResetBySuperAdmin: Boolean(
      data?.passwordResetBySuperAdmin ?? user.passwordResetBySuperAdmin
    ),
  };
}

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
    const nextUser = normalizeSessionUser(data);
    setSession(data.token, nextUser);
    setToken(data.token);
    setUser(nextUser);
    return { ...data, user: nextUser };
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      const t = getToken();
      if (t) setSession(t, next);
      return next;
    });
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

  const loginWithPassword = async (phone, password) => {
    const data = await loginPasswordApi(phone, password);
    return applySession(data);
  };

  /** @deprecated use loginWithPassword */
  const loginAdmin = async (password) => {
    throw new Error(
      "Admin login now requires phone + password. Use the main Sign in page."
    );
  };

  const logout = async () => {
    try {
      const t = getToken();
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
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
        loginWithPassword,
        loginAdmin,
        updateUser,
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
