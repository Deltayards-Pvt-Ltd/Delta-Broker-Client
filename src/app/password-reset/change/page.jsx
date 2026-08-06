"use client";

import { Suspense } from "react";
import Image from "next/image";
import PartnerShell from "@/app/component/PartnerShell";
import ChangePasswordForm from "@/app/component/ChangePasswordForm";
import styles from "@/app/pages/login.module.css";

function Fallback() {
  return (
    <PartnerShell navMode="pending" variant="light" hideBrand>
      <div className={`${styles.appTheme} ${styles.loading}`}>Loading…</div>
    </PartnerShell>
  );
}

function ChangePasswordAuth() {
  return (
    <PartnerShell navMode="pending" variant="light" hideBrand>
      <div className={styles.appTheme}>
        <div className={styles.brandHero}>
          <Image
            src="/loo_with_text.png"
            alt="Delta Yards Channel Partner"
            width={220}
            height={132}
            className={styles.brandHeroImg}
            priority
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.intro}>
            <h1 className={styles.title}>Set a new password</h1>
            <p className={styles.copy}>Use a 4-digit PIN.</p>
          </div>
          <ChangePasswordForm
            forced
            theme="app"
            backHref="/password-reset"
            successHref="/dashboard"
          />
        </div>
      </div>
    </PartnerShell>
  );
}

export default function PasswordResetChangePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ChangePasswordAuth />
    </Suspense>
  );
}
