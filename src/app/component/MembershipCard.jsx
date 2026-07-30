"use client";

import styles from "./MembershipCard.module.css";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return `+91 ${phone}`;
}

export default function MembershipCard({
  membershipId,
  name,
  partnerType,
  firmName,
  validFrom,
  validTill,
  phone,
  maharera,
  status,
}) {
  const displayName = name || "Partner";
  const initial = displayName.trim().charAt(0).toUpperCase() || "P";
  const subtitle =
    partnerType === "company"
      ? firmName || "Company partner"
      : firmName || "Individual partner";
  const isActive = !status || status === "approved";

  return (
    <div className={styles.card}>
      <span className={styles.watermark} aria-hidden>
        D
      </span>

      <div className={styles.top}>
        <p className={styles.eyebrow}>Channel Partner · Delta Yards</p>
        <span
          className={isActive ? styles.badge : styles.badgeMuted}
        >
          {isActive ? "Active" : status}
        </span>
      </div>

      <div className={styles.identity}>
        <div className={styles.avatar} aria-hidden>
          {initial}
        </div>
        <div className={styles.identityText}>
          <p className={styles.name}>{displayName}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.fields}>
        <div className={styles.fieldFull}>
          <span className={styles.label}>Membership ID</span>
          <span className={styles.value}>{membershipId || "—"}</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>RERA</span>
            <span className={styles.value}>{maharera || "—"}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>{formatPhone(phone)}</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>Member since</span>
            <span className={styles.value}>{formatDate(validFrom)}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Valid till</span>
            <span className={styles.value}>{formatDate(validTill)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
