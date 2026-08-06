"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./PartnerShell.module.css";

export default function PartnerShell({
  children,
  activeNav = null,
  wide = false,
  /** pending = hide Sign in / Register / Admin */
  navMode = "default",
  /** light = app sky / glass theme */
  variant = "dark",
  /** hide text/logo brand when page shows its own hero logo */
  hideBrand = false,
}) {
  const isPending = navMode === "pending";
  const isLight = variant === "light";

  return (
    <div className={isLight ? styles.pageLight : styles.page}>
      <div className={styles.wrap}>
        <header
          className={
            hideBrand ? `${styles.header} ${styles.headerNavOnly}` : styles.header
          }
        >
          {hideBrand ? (
            <span />
          ) : (
            <Link href={isPending ? "/pending" : "/"} className={styles.brand}>
              {isLight ? (
                <Image
                  src="/new_logo.png"
                  alt="Delta Yards"
                  width={48}
                  height={48}
                  className={styles.brandMark}
                  priority
                />
              ) : (
                <>
                  <span className={styles.brandWordmark}>
                    <span className={styles.brandDelta}>DELTA</span>{" "}
                    <span className={styles.brandYards}>YARDS</span>
                  </span>
                  <span className={styles.brandTag}>Channel Partner Platform</span>
                </>
              )}
            </Link>
          )}

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
