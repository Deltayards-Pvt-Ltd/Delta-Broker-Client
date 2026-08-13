"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL, getToken, isBrokerPending } from "@/lib/auth";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isBrokerPending(user) && pathname !== "/pending") {
      router.replace("/pending");
    }
  }, [loading, isAuthenticated, user, pathname, router]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || res.status !== 401) return;
        const data = await res.json().catch(() => ({}));
        if (
          data.code === "ACCOUNT_DISABLED" ||
          data.code === "SESSION_REVOKED"
        ) {
          await logout();
          router.replace("/login");
        }
      } catch {
        // network blip — don't kick
      }
    })();

    return () => {
      cancelled = true;
    };
    // logout identity is unstable; only re-check when the session user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user?.id, router]);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--ink-muted)",
          background: "transparent",
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (isBrokerPending(user)) return null;

  return children;
}
