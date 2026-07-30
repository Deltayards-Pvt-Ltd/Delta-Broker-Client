"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminAuthForm from "@/app/component/adminAuthForm";
import PartnerShell from "@/app/component/PartnerShell";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginPath } from "@/lib/auth";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(getPostLoginPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || isAuthenticated) {
    return (
      <PartnerShell activeNav="admin">
        <div className={styles.loading}>Loading…</div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell activeNav="admin">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Admin access</p>
        <h1 className={styles.title}>Admin sign in</h1>
        <p className={styles.copy}>
          Password-only access for DCP admins.
        </p>
      </div>
      <div className={styles.panel}>
        <AdminAuthForm />
      </div>
    </PartnerShell>
  );
}
