"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isStaffRole, isBrokerRole, staffLabel } from "@/lib/roles";
import { APP_VERSION } from "@/lib/constants";
import styles from "./page.module.css";

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function capitalize(v) {
  if (!v) return "—";
  const s = String(v);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "approved") return styles.statusOk;
  if (s === "pending") return styles.statusWarn;
  if (s === "rejected") return styles.statusDanger;
  return styles.statusMuted;
}

function MetaCell({ label, value }) {
  return (
    <div className={styles.metaCell}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value || "—"}</span>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const isStaff = isStaffRole(user?.role);
  const isBroker = isBrokerRole(user?.role);
  const status = user?.status || (isBroker ? "approved" : null);
  const rera = user?.maharera || user?.rera;
  const displayName =
    user?.name || (isStaff ? "Admin" : null) || user?.email || "—";

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account</h1>
      </header>

      <section className={styles.card}>
        <p className={styles.label}>Signed in as</p>
        <p className={styles.name}>{displayName}</p>
        <p className={styles.subtitle}>{staffLabel(user?.role)}</p>

        <div className={styles.divider} />

        <div className={styles.metaRow}>
          <MetaCell label="Email" value={user?.email} />
          <MetaCell label="Phone" value={user?.phone} />
        </div>
      </section>

      {isBroker ? (
        <section className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardMain}>
              <p className={styles.label}>Membership</p>
              <p className={styles.membershipId}>
                {user?.membershipId || "—"}
              </p>
              <p className={styles.subtitle}>
                Valid till {formatDate(user?.membershipValidTill)}
              </p>
            </div>
            {status ? (
              <span
                className={`${styles.statusPill} ${statusPillClass(status)}`}
              >
                {String(status).toUpperCase()}
              </span>
            ) : null}
          </div>

          <div className={styles.divider} />

          <div className={styles.metaRow}>
            <MetaCell
              label="Partner type"
              value={
                user?.firmName
                  ? `${capitalize(user.partnerType)} · ${user.firmName}`
                  : capitalize(user?.partnerType)
              }
            />
            <MetaCell
              label="Member since"
              value={formatDate(user?.membershipValidFrom)}
            />
          </div>

          {rera ? (
            <div className={styles.metaExtra}>
              <MetaCell label="RERA" value={rera} />
            </div>
          ) : null}
        </section>
      ) : null}

      {isStaff ? (
        <section className={styles.card}>
          <p className={styles.label}>Access</p>
          <p className={styles.membershipId}>{staffLabel(user?.role)}</p>
          <p className={styles.subtitle}>
            {user?.passwordResetBySuperAdmin
              ? "Password reset pending — please update when you can."
              : "Staff console access"}
          </p>
          <div className={styles.divider} />
          <Link href="/profile/password" className={styles.callBtn}>
            Change password
          </Link>
        </section>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.callBtn} onClick={() => {}}>
          Call Delta Yards office
        </button>

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <p className={styles.version}>Delta Yards · v{APP_VERSION}</p>
    </div>
  );
}
