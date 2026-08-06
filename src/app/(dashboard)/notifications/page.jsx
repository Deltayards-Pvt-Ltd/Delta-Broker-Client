"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isStaffRole } from "@/lib/roles";

/** Old path → role-based updates surface */
export default function NotificationsRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isStaffRole(user?.role)) {
      router.replace("/broadcast");
    } else {
      router.replace("/updates");
    }
  }, [loading, user, router]);

  return null;
}
