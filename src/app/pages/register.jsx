"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PartnerShell from "@/app/component/PartnerShell";
import RegisterForm from "@/app/component/registerForm";
import { getPostLoginPath } from "@/lib/auth";
import styles from "./register.module.css";

const NEXT_STEPS = [
  "Our team reviews your application",
  "Membership card is minted on approval",
  "Sign in with your verified credentials",
  "Browse projects and receive broadcasts",
];

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(getPostLoginPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || isAuthenticated) {
    return (
      <PartnerShell activeNav="register" wide>
        <div className={styles.loading}>Loading…</div>
      </PartnerShell>
    );
  }

  if (done) {
    return (
      <PartnerShell navMode="pending" wide>
        <div className={`${styles.intro} ${styles.reveal}`}>
          <p className={styles.eyebrow}>Under review</p>
          <h1 className={styles.title}>Pending approval</h1>
          <p className={styles.copy}>
            Your registration is with the Delta Yards team. Once approved,
            you&apos;ll get a membership ID (e.g. DCP-2026-00150) and full
            project access.
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
          <Link href="/login" className={styles.pendingCta}>
            Back to sign in
          </Link>
        </div>
      </PartnerShell>
    );
  }

  return (
    <PartnerShell activeNav="register" wide>
      <div className={`${styles.intro} ${styles.reveal}`}>
        <p className={styles.eyebrow}>Register & verify</p>
        <h1 className={styles.title}>Join the partner network</h1>
        <p className={styles.copy}>
          Fill your details, verify email + mobile with OTP, then accept terms
          to submit.
        </p>
      </div>

      <div
        className={`${styles.steps} ${styles.reveal} ${styles.delay}`}
        aria-label="Registration steps"
      >
        <div
          className={`${styles.step} ${
            step === 1 ? styles.stepActive : styles.stepDone
          }`}
        >
          <span className={styles.stepDot}>{step > 1 ? "✓" : "1"}</span>
          <span className={styles.stepLabel}>Fill details</span>
        </div>
        <div
          className={`${styles.stepLine} ${step > 1 ? styles.stepLineDone : ""}`}
        />
        <div
          className={`${styles.step} ${step === 2 ? styles.stepActive : ""}`}
        >
          <span className={styles.stepDot}>2</span>
          <span className={styles.stepLabel}>Terms & conditions</span>
        </div>
      </div>

      <div className={`${styles.reveal} ${styles.delay}`}>
        <RegisterForm
          step={step}
          onStepChange={setStep}
          onPendingDone={() => setDone(true)}
        />
      </div>
    </PartnerShell>
  );
}
