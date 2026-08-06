"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PartnerShell from "@/app/component/PartnerShell";
import { useAuth } from "@/context/AuthContext";
import { skipPasswordReset } from "@/lib/loginApi";
import { isStaffRole } from "@/lib/roles";
import styles from "@/app/pages/login.module.css";
import formStyles from "@/app/component/authForm.module.css";

export default function PasswordResetGatePage() {
  const router = useRouter();
  const { user, token, loading, isAuthenticated, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isStaffRole(user?.role)) {
      router.replace("/dashboard");
      return;
    }
    if (!user?.passwordResetBySuperAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, user, router]);

  const onContinue = () => {
    router.push("/password-reset/change");
  };

  const onSkip = async () => {
    setError("");
    setBusy(true);
    try {
      await skipPasswordReset(token);
      updateUser({ passwordResetBySuperAdmin: true });
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Could not skip");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !isAuthenticated || !user?.passwordResetBySuperAdmin) {
    return (
      <PartnerShell navMode="pending" variant="light" hideBrand>
        <div className={`${styles.appTheme} ${styles.loading}`}>Loading…</div>
      </PartnerShell>
    );
  }

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
            <h1 className={styles.title}>Password was reset</h1>
            <p className={styles.copy}>
              A super admin reset your password. Update it now, or skip and
              we&apos;ll send you a reminder notification.
            </p>
          </div>

          <div className={`${formStyles.form} ${formStyles.app}`}>
            {error ? (
              <p className={formStyles.error} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className={formStyles.submit}
              onClick={onContinue}
              disabled={busy}
            >
              Continue to update →
            </button>

            <button
              type="button"
              className={formStyles.linkBtn}
              onClick={onSkip}
              disabled={busy}
              style={{ textAlign: "center", width: "100%" }}
            >
              {busy ? "Skipping…" : "Skip for now"}
            </button>

            <p className={formStyles.secureHint}>
              <span className={formStyles.secureHintIcon} aria-hidden>
                ✓
              </span>
              You can change it anytime in Account
            </p>
          </div>
        </div>
      </div>
    </PartnerShell>
  );
}
