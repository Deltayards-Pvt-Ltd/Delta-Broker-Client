"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchOffer } from "@/lib/offerApi";
import OfferForm from "../../OfferForm";
import styles from "../../offers.module.css";

export default function EditOfferPage() {
  const params = useParams();
  const id = params?.id;
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOffer(id)
      .then((d) => setOffer(d.offer))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit offer</h1>
          <p className={styles.sub}>
            Update details, targeting, or re-broadcast to the audience.
          </p>
        </div>
      </div>
      {loading ? <p className={styles.hint}>Loading…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {offer ? <OfferForm mode="edit" initial={offer} /> : null}
    </div>
  );
}
