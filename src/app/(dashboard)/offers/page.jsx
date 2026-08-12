"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import { deleteOffer, fetchOffers } from "@/lib/offerApi";
import styles from "./offers.module.css";

export default function OffersPage() {
  const { user } = useAuth();
  const canWrite = isSuperAdminRole(user?.role);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOffers({ page: 1, limit: 50 });
      setOffers(data.offers || []);
    } catch (err) {
      setError(err.message || "Failed to load offers");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id) => {
    if (!canWrite) return;
    if (!window.confirm("Delete this offer?")) return;
    setOk("");
    setError("");
    try {
      await deleteOffer(id);
      setOk("Offer deleted");
      load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Offers</h1>
          <p className={styles.sub}>
            Global and project-specific partner incentives. Visible to all
            channel partners — broadcast audience is optional when notifying.
          </p>
        </div>
        {canWrite ? (
          <Link href="/offers/new" className={styles.btn}>
            <Plus size={16} /> New offer
          </Link>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}

      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : !offers.length ? (
        <div className={styles.empty}>No offers yet.</div>
      ) : (
        <div className={styles.list}>
          {offers.map((o) => (
            <div key={o._id} className={styles.card}>
              {o.bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.bannerImage} alt="" className={styles.thumb} />
              ) : (
                <div className={styles.thumb} />
              )}
              <div className={styles.meta}>
                <h3>{o.title}</h3>
                <p>
                  {o.project?.name
                    ? `Project · ${o.project.name}`
                    : "Global offer"}
                  {" · All partners"}
                </p>
                <div className={styles.badges}>
                  <span
                    className={`${styles.badge} ${
                      o.active ? styles.badgeOn : styles.badgeOff
                    }`}
                  >
                    {o.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              {canWrite ? (
                <div className={styles.actions}>
                  <Link
                    href={`/offers/${o._id}/edit`}
                    className={`${styles.btn} ${styles.btnGhost}`}
                  >
                    <Pencil size={14} /> Edit
                  </Link>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => onDelete(o._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
