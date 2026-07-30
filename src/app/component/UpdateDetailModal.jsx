"use client";

import { X } from "lucide-react";
import styles from "./UpdateDetailModal.module.css";

function timeLabel(date) {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UpdateDetailModal({
  open,
  item,
  onClose,
  kindLabel,
  footer = null,
}) {
  if (!open || !item) return null;

  const title = item.title || "Update";
  const message = item.message || "";
  const link = item.link || item.meta?.link || "";
  const when = item.createdAt;

  return (
    <div className={styles.overlay} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-detail-title"
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            {kindLabel ? (
              <span className={styles.badge}>{kindLabel}</span>
            ) : null}
            <h2 id="update-detail-title" className={styles.title}>
              {title}
            </h2>
            {when ? <p className={styles.meta}>{timeLabel(when)}</p> : null}
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
          {link ? (
            <a
              href={link}
              target={/^https?:\/\//i.test(link) ? "_blank" : undefined}
              rel={
                /^https?:\/\//i.test(link) ? "noopener noreferrer" : undefined
              }
              className={styles.link}
            >
              {link}
            </a>
          ) : null}
        </div>

        <footer className={styles.footer}>
          {footer}
          <button type="button" className={styles.done} onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
