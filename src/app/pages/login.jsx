"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/app/component/authForm";
import PartnerShell from "@/app/component/PartnerShell";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginPath } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      router.replace("/register");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(getPostLoginPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || isAuthenticated) {
    return (
      <PartnerShell activeNav="login">
        <div className={styles.loading}>Loading…</div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell activeNav="login">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>DCP · Partner access</p>
        <h1 className={styles.title}>Sign in to your partnership.</h1>
        <p className={styles.copy}>
          Use the mobile number you registered with. We&apos;ll send a one-time
          code.
        </p>
      </div>
      <div className={styles.panel}>
        <AuthForm />
      </div>
    </PartnerShell>
  );
}
