"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessPath } from "@/lib/nav";

export default function RoleGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.role) return;

    if (!canAccessPath(pathname, user.role)) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, user, pathname, router]);

  if (loading || !isAuthenticated) return null;

  if (user?.role && !canAccessPath(pathname, user.role)) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Redirecting…
      </div>
    );
  }

  return children;
}
