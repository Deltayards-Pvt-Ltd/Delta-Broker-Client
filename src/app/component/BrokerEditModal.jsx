"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateBroker } from "@/lib/brokerApi";
import styles from "./BrokerEditModal.module.css";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  maharera: "",
  partnerType: "individual",
  firmName: "",
};

export default function BrokerEditModal({ broker, open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !broker) return;
    setError("");
    setForm({
      name: broker.name || "",
      email: broker.email || "",
      phone: broker.phone || "",
      maharera: broker.maharera || "",
      partnerType: broker.partnerType === "company" ? "company" : "individual",
      firmName: broker.firmName || "",
    });
  }, [open, broker]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open || !broker) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isCompany = form.partnerType === "company";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Name, email and phone are required.");
      return;
    }
    if (isCompany && !form.firmName.trim()) {
      setError("Firm name is required for company partners.");
      return;
    }

    setSaving(true);
    try {
      const data = await updateBroker(broker._id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        maharera: form.maharera.trim(),
        partnerType: form.partnerType,
        firmName: isCompany ? form.firmName.trim() : "",
      });
      onSaved?.(data.broker);
      onClose?.();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="broker-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>Edit partner</p>
            <h2 id="broker-edit-title" className={styles.title}>
              {broker.name || "Broker"}
            </h2>
            {broker.membershipId ? (
              <p className={styles.meta}>{broker.membershipId}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Type</span>
              <select
                value={form.partnerType}
                onChange={(e) => setField("partnerType", e.target.value)}
                disabled={saving}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Full name</span>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={saving}
                required
              />
            </label>
          </div>

          {isCompany ? (
            <label className={styles.field}>
              <span>Firm name</span>
              <input
                value={form.firmName}
                onChange={(e) => setField("firmName", e.target.value)}
                disabled={saving}
                placeholder="Registered firm name"
                required
              />
            </label>
          ) : null}

          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={saving}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                disabled={saving}
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>RERA / MahaRERA</span>
            <input
              value={form.maharera}
              onChange={(e) => setField("maharera", e.target.value)}
              disabled={saving}
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className={styles.save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
