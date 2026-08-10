"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PartnerShell from "@/app/component/PartnerShell";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginPath, isBrokerPending } from "@/lib/auth";
import styles from "../pages/register.module.css";

const NEXT_STEPS = [
  "Our team reviews your application",
  "You'll get a membership ID (e.g. DCP-2026-00149) on approval",
  "Then browse projects from your dashboard",
];

export default function PendingPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isBrokerPending(user)) {
      router.replace(getPostLoginPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  const handleBackToSignIn = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading || !isAuthenticated || !isBrokerPending(user)) {
    return (
      <PartnerShell navMode="pending" wide variant="light" hideBrand>
        <div className={styles.loading}>Loading…</div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell navMode="pending" wide variant="light" hideBrand>
      <div className={`${styles.brandHero}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/new_logo.png"
          alt="Delta Yards"
          className={styles.brandHeroImg}
        />
      </div>
      <div className={`${styles.panel} ${styles.reveal}`}>
        <p className={styles.eyebrow}>Under review</p>
        <h1 className={styles.title}>Pending approval</h1>
        <p className={styles.copy}>
          You&apos;re signed in
          {user?.name ? ` as ${user.name}` : ""}, but your partner account
          is still waiting for admin approval. Full project access unlocks
          after approval.
        </p>
      </div>

      <div className={`${styles.nextCard} ${styles.reveal} ${styles.delay}`}>
        <h2 className={styles.nextTitle}>What happens next</h2>
        <ol className={styles.nextList}>
          {NEXT_STEPS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <div className={`${styles.pendingActions} ${styles.reveal} ${styles.delay}`}>
        <button
          type="button"
          className={styles.pendingCta}
          onClick={handleBackToSignIn}
        >
          Back to sign in
        </button>
      </div>
    </PartnerShell>
  );
}
