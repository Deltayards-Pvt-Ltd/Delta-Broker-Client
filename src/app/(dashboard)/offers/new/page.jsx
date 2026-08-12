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
            Active offers show for all partners. Optionally notify everyone with
            a broadcast.
          </p>
        </div>
      </div>
      <OfferForm mode="create" />
    </div>
  );
}
