"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginPath } from "@/lib/auth";
import styles from "./page.module.css";

const STEPS = [
  { step: "01", title: "Register", body: "Full name, email + mobile OTP, RERA." },
  { step: "02", title: "Admin review", body: "Delta Yards approves your application." },
  { step: "03", title: "Membership", body: "Card minted — DCP-2026-…" },
  { step: "04", title: "Browse", body: "Projects + broadcast updates." },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(getPostLoginPath(user));
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={`${styles.header} ${styles.reveal}`}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandWordmark}>
              <span className={styles.brandDelta}>DELTA</span>{" "}
              <span className={styles.brandYards}>YARDS</span>
            </span>
            <span className={styles.brandTag}>Channel Partner Platform</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/login" className={styles.navPrimary}>
              Sign in
            </Link>
            <Link href="/register">Register</Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <p className={`${styles.eyebrow} ${styles.reveal} ${styles.delay1}`}>
            DCP · Channel Partner Platform
          </p>
          <h1 className={`${styles.title} ${styles.reveal} ${styles.delay2}`}>
            Register. Get approved.
            <br />
            <span className={styles.accent}>Sell with Delta.</span>
          </h1>
          <p className={`${styles.copy} ${styles.reveal} ${styles.delay3}`}>
            Join DCP — verify your email and mobile, submit your RERA details,
            and access the full project portfolio after admin approval.
          </p>

          <div className={`${styles.ctaGroup} ${styles.reveal} ${styles.delay4}`}>
            <Link href="/register" className={styles.cta}>
              <span>Register as partner</span>
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Already registered? Sign in
            </Link>
          </div>
        </section>

        <section className={styles.steps} aria-label="How it works">
          {STEPS.map((s, i) => (
            <article
              key={s.step}
              className={`${styles.step} ${styles.reveal} ${styles[`delay${i + 5}`] || styles.delay5}`}
            >
              <div className={styles.stepNum}>{s.step}</div>
              <h2 className={styles.stepTitle}>{s.title}</h2>
              <p className={styles.stepBody}>{s.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
