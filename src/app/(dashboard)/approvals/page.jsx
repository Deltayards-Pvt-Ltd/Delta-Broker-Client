"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveBroker,
  fetchPendingBrokers,
  rejectBroker,
} from "@/lib/brokerApi";
import { setPendingCount } from "@/lib/pendingStore";
import styles from "./approvals.module.css";

export default function ApprovalsPage() {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchPendingBrokers();
      const list = data.brokers || [];
      setBrokers(list);
      setPendingCount(list.length);
    } catch (err) {
      setError(err.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onApprove = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await approveBroker(id);
      setBrokers((prev) => {
        const next = prev.filter((b) => b._id !== id);
        setPendingCount(next.length);
        return next;
      });
    } catch (err) {
      setError(err.message || "Approve failed");
    } finally {
      setBusyId("");
    }
  };

  const onReject = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await rejectBroker(id);
      setBrokers((prev) => {
        const next = prev.filter((b) => b._id !== id);
        setPendingCount(next.length);
        return next;
      });
    } catch (err) {
      setError(err.message || "Reject failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Pending approvals</h1>
          <p className={styles.copy}>
            Review broker registrations. Approve to unlock login, or reject so
            they can re-apply.
          </p>
        </div>
        <button type="button" className={styles.refresh} onClick={load}>
          Refresh
        </button>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : brokers.length === 0 ? (
        <div className={styles.empty}>No pending registrations.</div>
      ) : (
        <div className={styles.list}>
          {brokers.map((b) => (
            <article key={b._id} className={styles.card}>
              <div className={styles.cardMain}>
                <h2 className={styles.name}>{b.name}</h2>
                <p className={styles.meta}>{b.email}</p>
                <p className={styles.meta}>{b.phone}</p>
                {b.maharera ? (
                  <p className={styles.meta}>MahaRERA: {b.maharera}</p>
                ) : null}
                <p className={styles.meta}>
                  Submitted{" "}
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleString()
                    : "—"}
                </p>
                <div className={styles.badges}>
                  <span className={b.emailVerified ? styles.ok : styles.no}>
                    {b.emailVerified ? "Email verified" : "Email not verified"}
                  </span>
                  <span className={b.phoneVerified ? styles.ok : styles.no}>
                    {b.phoneVerified ? "Mobile verified" : "Mobile not verified"}
                  </span>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approve}
                  disabled={busyId === b._id}
                  onClick={() => onApprove(b._id)}
                >
                  {busyId === b._id ? "…" : "Approve"}
                </button>
                <button
                  type="button"
                  className={styles.reject}
                  disabled={busyId === b._id}
                  onClick={() => onReject(b._id)}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
