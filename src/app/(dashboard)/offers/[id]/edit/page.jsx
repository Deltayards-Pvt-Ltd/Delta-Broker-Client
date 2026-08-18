"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import { fetchOffer } from "@/lib/offerApi";
import OfferForm from "../../OfferForm";
import styles from "../../offers.module.css";

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canWrite = isSuperAdminRole(user?.role);
  const id = params?.id;
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !canWrite) router.replace("/offers");
  }, [authLoading, canWrite, router]);

  useEffect(() => {
    if (!id || !canWrite) return;
    setLoading(true);
    fetchOffer(id)
      .then((d) => setOffer(d.offer))
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [id, canWrite]);

  if (authLoading || !canWrite) {
    return <p className={styles.hint}>Loading…</p>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit offer</h1>
          <p className={styles.sub}>
            Update dates or Active anytime. Past end dates auto-deactivate for
            partners — extend the end date to bring an offer back live.
          </p>
        </div>
      </div>
      {loading ? <p className={styles.hint}>Loading…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {offer ? <OfferForm mode="edit" initial={offer} /> : null}
    </div>
  );
}
