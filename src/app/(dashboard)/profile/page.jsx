"use client";

import { useAuth } from "@/context/AuthContext";
import MembershipCard from "@/app/component/MembershipCard";
import styles from "./page.module.css";

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value || "—"}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const typeLabel =
    user?.partnerType === "company" ? "Company" : "Individual";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Profile</p>
        <h1 className={styles.title}>{user?.name || "Partner"}</h1>
        <p className={styles.copy}>
          Your membership and registration details.
        </p>
      </header>

      <MembershipCard
        membershipId={user?.membershipId}
        name={user?.name}
        partnerType={user?.partnerType}
        firmName={user?.firmName}
        validFrom={user?.membershipValidFrom}
        validTill={user?.membershipValidTill}
        phone={user?.phone}
        maharera={user?.maharera}
        status={user?.status}
      />

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Account</h2>
        <dl className={styles.list}>
          <Row label="Email" value={user?.email} />
          <Row
            label="Mobile"
            value={user?.phone ? `+91 ${user.phone}` : null}
          />
          <Row label="Partner type" value={typeLabel} />
          {user?.partnerType === "company" ? (
            <Row label="Firm name" value={user?.firmName} />
          ) : null}
          <Row label="RERA / MahaRERA" value={user?.maharera} />
          <Row label="Membership ID" value={user?.membershipId} />
          <Row
            label="Status"
            value={user?.status === "approved" ? "Active" : user?.status}
          />
        </dl>
      </section>
    </div>
  );
}
