"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChangePasswordForm from "@/app/component/ChangePasswordForm";
import styles from "../page.module.css";
import passStyles from "./password.module.css";

export default function ChangePasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forced = searchParams.get("forced") === "1";

  useEffect(() => {
    if (forced) {
      router.replace("/password-reset/change");
    }
  }, [forced, router]);

  if (forced) {
    return (
      <p className={styles.subtitle} style={{ padding: "1rem 0" }}>
        Redirecting…
      </p>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Change password</h1>
        <p className={styles.subtitle}>Use a 4-digit PIN.</p>
      </header>

      <section className={passStyles.card}>
        <ChangePasswordForm theme="app" backHref="/profile" />
      </section>
    </div>
  );
}
