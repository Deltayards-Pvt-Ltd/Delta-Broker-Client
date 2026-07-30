"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/nav";
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

function roleLabel(user) {
  if (!user?.role) return "—";
  if (user.role === ROLES.ADMIN) return "Admin";
  if (user.role === ROLES.BROKER) return "Channel Partner";
  return capitalize(user.role);
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

  const isAdmin = user?.role === ROLES.ADMIN;
  const isBroker = user?.role === ROLES.BROKER;
  const status = user?.status || (isBroker ? "approved" : null);
  const rera = user?.maharera || user?.rera;
  const displayName =
    user?.name || (isAdmin ? "Admin" : null) || user?.email || "—";

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace(isAdmin ? "/admin/login" : "/login");
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
        <p className={styles.subtitle}>{roleLabel(user)}</p>

        <div className={styles.divider} />

        <div className={styles.metaRow}>
          <MetaCell label="Email" value={user?.email} />
          {isBroker ? <MetaCell label="Phone" value={user?.phone} /> : null}
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

      {isAdmin ? (
        <section className={styles.card}>
          <p className={styles.label}>Access</p>
          <p className={styles.membershipId}>Admin console</p>
          <p className={styles.subtitle}>
            Full platform management access
          </p>
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
