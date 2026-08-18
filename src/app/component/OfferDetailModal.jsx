"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isStaffRole, isSuperAdminRole } from "@/lib/roles";
import { downloadNamedImage } from "@/lib/downloadAsset";
import { offerBadge } from "@/lib/offerBadge";
import styles from "./OfferDetailModal.module.css";

function formatRange(startsAt, endsAt) {
  const fmt = (d) => {
    if (!d) return null;
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    return x.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  const a = fmt(startsAt);
  const b = fmt(endsAt);
  if (a && b) return `${a} – ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return null;
}

export default function OfferDetailModal({
  open,
  offer,
  loading = false,
  error = "",
  onClose,
}) {
  const { user } = useAuth();
  const canEdit = isSuperAdminRole(user?.role);
  const isStaff = isStaffRole(user?.role);
  const [dlBusy, setDlBusy] = useState(false);
  const [dlError, setDlError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    setDlBusy(false);
    setDlError("");
  }, [offer?._id]);

  if (!open) return null;

  const image = String(offer?.bannerImage || "").trim();
  const range = offer ? formatRange(offer.startsAt, offer.endsAt) : null;
  const badge = offer ? offerBadge(offer.startsAt, offer.endsAt) : null;

  const onDownload = async () => {
    if (!image || dlBusy) return;
    setDlError("");
    setDlBusy(true);
    try {
      await downloadNamedImage(image, offer?.title || "offer", "offer");
    } catch (err) {
      setDlError(err.message || "Download failed");
    } finally {
      setDlBusy(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-detail-title"
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        {loading ? (
          <p className={styles.hint}>Loading offer…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : offer ? (
          <>
            {image ? (
              <div className={styles.heroWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={offer.title || "Offer"}
                  className={styles.hero}
                />
              </div>
            ) : null}

            <div className={styles.body}>
              <p className={styles.eyebrow}>
                {offer.project?.name
                  ? `Project · ${offer.project.name}`
                  : "Global offer"}
              </p>
              <h2 id="offer-detail-title" className={styles.title}>
                {offer.title}
              </h2>
              {range ? <p className={styles.hint}>{range}</p> : null}

              <div className={styles.badges}>
                {isStaff ? (
                  <>
                    <span
                      className={`${styles.badge} ${
                        offer.active ? styles.badgeOn : styles.badgeOff
                      }`}
                    >
                      {offer.active ? "Active" : "Inactive"}
                    </span>
                    {offer.expired ? (
                      <span className={`${styles.badge} ${styles.badgeExpire}`}>
                        Expired
                      </span>
                    ) : null}
                  </>
                ) : null}
                {badge ? (
                  <span
                    className={`${styles.badge} ${
                      badge.kind === "start"
                        ? styles.badgeStart
                        : styles.badgeExpire
                    }`}
                  >
                    {badge.label}
                  </span>
                ) : null}
              </div>

              {offer.description ? (
                <p className={styles.copy}>{offer.description}</p>
              ) : (
                <p className={styles.hint}>No description.</p>
              )}

              {dlError ? <p className={styles.error}>{dlError}</p> : null}

              <div className={styles.actions}>
                {image ? (
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={dlBusy}
                    onClick={onDownload}
                  >
                    <Download size={16} />
                    {dlBusy ? "Saving…" : "Download image"}
                  </button>
                ) : null}
                {canEdit && offer._id ? (
                  <Link
                    href={`/offers/${offer._id}/edit`}
                    className={styles.primary}
                  >
                    Edit offer
                  </Link>
                ) : null}
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.hint}>Offer not found.</p>
        )}
      </div>
    </div>
  );
}
