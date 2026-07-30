"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isBrokerPending } from "@/lib/auth";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, user } = useAuth();

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
