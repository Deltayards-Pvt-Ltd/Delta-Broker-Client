"use client";

import Link from "next/link";
import styles from "./PartnerShell.module.css";

export default function PartnerShell({
  children,
  activeNav = null,
  wide = false,
  /** pending = hide Sign in / Register / Admin */
  navMode = "default",
}) {
  const isPending = navMode === "pending";

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link href={isPending ? "/pending" : "/"} className={styles.brand}>
            <span className={styles.brandWordmark}>
              <span className={styles.brandDelta}>DELTA</span>{" "}
              <span className={styles.brandYards}>YARDS</span>
            </span>
            <span className={styles.brandTag}>Channel Partner Platform</span>
          </Link>

          {isPending ? null : (
            <nav className={styles.nav}>
              <Link
                href="/login"
                className={activeNav === "login" ? styles.navActive : undefined}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={
                  activeNav === "register" ? styles.navActive : undefined
                }
              >
                Register
              </Link>
              <Link
                href="/admin/login"
                className={activeNav === "admin" ? styles.navActive : undefined}
              >
                Admin
              </Link>
            </nav>
          )}
        </header>

        <div className={wide ? styles.contentWide : styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
