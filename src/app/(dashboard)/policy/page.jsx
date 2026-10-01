"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TermsReader from "@/app/component/TermsReader";
import { useAuth } from "@/context/AuthContext";
import { API_URL, getToken } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/roles";
import styles from "./page.module.css";

export default function PolicyPage() {
  const { user } = useAuth();
  const superAdmin = isSuperAdminRole(user?.role);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const closeModal = () => {
    if (busy) return;
    setOpen(false);
    setFile(null);
    setNotify(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/policy?notify=${notify ? "1" : "0"}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/pdf",
          },
          body: file,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not update the policy");
      setRev((n) => n + 1);
      setOpen(false);
      setFile(null);
      setNotify(false);
      setToast({
        ok: true,
        text: notify
          ? `Policy updated. Sent ${data.mail?.sent ?? 0}.`
          : "Policy updated.",
      });
    } catch (err) {
      setOpen(false);
      setFile(null);
      setNotify(false);
      setToast({
        ok: false,
        text: err.message || "Could not update the policy",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      {superAdmin ? (
        <div className={styles.top}>
          <button type="button" className={styles.btn} onClick={() => setOpen(true)}>
            Update policy
          </button>
        </div>
      ) : null}
      <div className={styles.reader}>
        <TermsReader key={rev} mode="view" />
      </div>
      {open
        ? createPortal(
            <div className={styles.overlay}>
              <button
                type="button"
                className={styles.backdrop}
                aria-label="Close"
                onClick={closeModal}
              />
              <form className={styles.modal} onSubmit={onSubmit}>
                <div className={styles.head}>
                  <h2 className={styles.title}>Update policy</h2>
                  <button
                    type="button"
                    className={styles.close}
                    onClick={closeModal}
                    disabled={busy}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <label className={styles.field}>
                  PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                  />
                  Email this policy to all brokers and admins
                </label>
                <button className={styles.btn} type="submit" disabled={!file || busy}>
                  {busy ? "Updating…" : "Update"}
                </button>
              </form>
            </div>,
            document.body
          )
        : null}
      {toast
        ? createPortal(
            <div
              className={toast.ok ? styles.toast : `${styles.toast} ${styles.toastFail}`}
              role="status"
            >
              {toast.text}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
