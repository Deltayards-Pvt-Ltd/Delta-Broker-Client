"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  BROADCAST_AUDIENCES,
  BROADCAST_KINDS,
  sendBroadcast,
} from "@/lib/broadcastApi";
import { fetchCategories } from "@/lib/categoryApi";
import { fetchBrokers } from "@/lib/brokerApi";
import styles from "./SendBroadcastModal.module.css";

export default function SendBroadcastModal({ open, onClose, onSent }) {
  const [kind, setKind] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState("all");
  const [categoryIds, setCategoryIds] = useState([]);
  const [brokerIds, setBrokerIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brokerSearch, setBrokerSearch] = useState("");
  const [brokerHits, setBrokerHits] = useState([]);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setKind("general");
    setTitle("");
    setMessage("");
    setLink("");
    setAudience("all");
    setCategoryIds([]);
    setBrokerIds([]);
    setBrokerSearch("");
    setBrokerHits([]);
    setSelectedBrokers([]);
    setError("");
    setBusy(false);

    fetchCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, [open]);

  useEffect(() => {
    if (!open || audience !== "brokers") return;
    const q = brokerSearch.trim();
    if (q.length < 2) {
      setBrokerHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchBusy(true);
      try {
        const data = await fetchBrokers({ status: "approved", q, limit: 20 });
        if (!cancelled) setBrokerHits(data.brokers || []);
      } catch {
        if (!cancelled) setBrokerHits([]);
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [brokerSearch, audience, open]);

  const sendLabel = useMemo(() => {
    if (audience === "all") return "Send to all brokers";
    if (audience === "categories") {
      if (!categoryIds.length) return "Select a category";
      return `Send to ${categoryIds.length} categor${
        categoryIds.length === 1 ? "y" : "ies"
      }`;
    }
    if (!brokerIds.length) return "Select brokers";
    return `Send to ${brokerIds.length} broker${brokerIds.length === 1 ? "" : "s"}`;
  }, [audience, categoryIds, brokerIds]);

  if (!open) return null;

  const toggleCategory = (id) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleBroker = (broker) => {
    const id = String(broker._id);
    setBrokerIds((prev) => {
      if (prev.includes(id)) {
        setSelectedBrokers((s) => s.filter((b) => String(b._id) !== id));
        return prev.filter((x) => x !== id);
      }
      setSelectedBrokers((s) =>
        s.some((b) => String(b._id) === id) ? s : [...s, broker]
      );
      return [...prev, id];
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (audience === "categories" && categoryIds.length === 0) {
      setError("Select at least one category.");
      return;
    }
    if (audience === "brokers" && brokerIds.length === 0) {
      setError("Select at least one broker.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        kind,
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        audience,
      };
      if (audience === "categories") payload.categoryIds = categoryIds;
      if (audience === "brokers") payload.brokerIds = brokerIds;

      const data = await sendBroadcast(payload);
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
              placeholder="Message to partners…"
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

          <fieldset className={styles.audience}>
            <legend className={styles.label}>Audience</legend>
            <div className={styles.kinds} role="group" aria-label="Audience">
              {BROADCAST_AUDIENCES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`${styles.kindBtn} ${
                    audience === a.key ? styles.kindActive : ""
                  }`}
                  onClick={() => setAudience(a.key)}
                  disabled={busy}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {audience === "categories" ? (
              <div className={styles.audiencePanel}>
                {categories.length === 0 ? (
                  <p className={styles.hint}>
                    No categories yet. Create one under Brokers → Categories.
                  </p>
                ) : (
                  <ul className={styles.checkList}>
                    {categories.map((c) => (
                      <li key={c._id}>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(c._id)}
                            onChange={() => toggleCategory(c._id)}
                            disabled={busy}
                          />
                          <span>
                            <strong>{c.name}</strong>
                            <span className={styles.meta}>
                              {c.brokerCount || 0} members
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {audience === "brokers" ? (
              <div className={styles.audiencePanel}>
                <input
                  className={styles.input}
                  value={brokerSearch}
                  onChange={(e) => setBrokerSearch(e.target.value)}
                  placeholder="Search name, phone, email…"
                  disabled={busy}
                />
                {searchBusy ? (
                  <p className={styles.hint}>Searching…</p>
                ) : null}
                {brokerHits.length > 0 ? (
                  <ul className={styles.checkList}>
                    {brokerHits.map((b) => {
                      const id = String(b._id);
                      return (
                        <li key={id}>
                          <label className={styles.checkRow}>
                            <input
                              type="checkbox"
                              checked={brokerIds.includes(id)}
                              onChange={() => toggleBroker(b)}
                              disabled={busy}
                            />
                            <span>
                              <strong>{b.name}</strong>
                              <span className={styles.meta}>
                                {b.phone}
                                {b.firmName ? ` · ${b.firmName}` : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {selectedBrokers.length > 0 ? (
                  <p className={styles.hint}>
                    Selected:{" "}
                    {selectedBrokers.map((b) => b.name).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

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
              {busy ? "Sending…" : sendLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
