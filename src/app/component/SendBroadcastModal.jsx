"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BROADCAST_KINDS, sendBroadcast } from "@/lib/broadcastApi";
import styles from "./SendBroadcastModal.module.css";

export default function SendBroadcastModal({ open, onClose, onSent }) {
  const [kind, setKind] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKind("general");
    setTitle("");
    setMessage("");
    setLink("");
    setError("");
    setBusy(false);
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setBusy(true);
    try {
      const data = await sendBroadcast({
        kind,
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
      });
      onSent?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message || "Could not send");
    } finally {
      setBusy(false);
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
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-broadcast-title"
      >
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>New update</p>
            <h2 id="send-broadcast-title" className={styles.title}>
              Send broadcast
            </h2>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.kinds} role="group" aria-label="Broadcast type">
            {BROADCAST_KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                className={`${styles.kindBtn} ${
                  kind === k.key ? styles.kindActive : ""
                }`}
                onClick={() => setKind(k.key)}
                disabled={busy}
              >
                {k.label}
              </button>
            ))}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Channel Partner Meet · Saturday"
              disabled={busy}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Message</span>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to all brokers…"
              rows={5}
              disabled={busy}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Link (optional)</span>
            <input
              className={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://… or /projects"
              disabled={busy}
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className={styles.send} disabled={busy}>
              {busy ? "Sending…" : "Send to all brokers"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
