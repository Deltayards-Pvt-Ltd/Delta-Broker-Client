"use client";

import { useEffect } from "react";
import Image from "next/image";
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
      <PartnerShell activeNav="login" variant="light" hideBrand>
        <div className={`${styles.appTheme} ${styles.loading}`}>Loading…</div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell activeNav="login" variant="light" hideBrand>
      <div className={styles.appTheme}>
        <div className={styles.brandHero}>
          <Image
            src="/loo_with_text.png"
            alt="Delta Yards Channel Partner"
            width={280}
            height={168}
            className={styles.brandHeroImg}
            priority
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.intro}>
            <h1 className={styles.title}>Welcome back!</h1>
            <p className={styles.subheading}>Sign in to your partnership</p>
            <p className={styles.copy}>
              Enter your registered mobile. Partners get an OTP; admins enter a
              password.
            </p>
          </div>
          <AuthForm theme="app" />
        </div>
      </div>
    </PartnerShell>
  );
}
