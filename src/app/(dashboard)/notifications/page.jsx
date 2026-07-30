"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Old path → role-based updates surface */
export default function NotificationsRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") {
      router.replace("/broadcast");
    } else {
      router.replace("/updates");
    }
  }, [loading, user, router]);

  return null;
}
