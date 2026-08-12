"use client";

import OfferForm from "../OfferForm";
import styles from "../offers.module.css";

export default function NewOfferPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>New offer</h1>
          <p className={styles.sub}>
            Offer is visible to all partners. Optionally broadcast to a targeted
            audience (categories / brokers).
          </p>
        </div>
      </div>
      <OfferForm mode="create" />
    </div>
  );
}
