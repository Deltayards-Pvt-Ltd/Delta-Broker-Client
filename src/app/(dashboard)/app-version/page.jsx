"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAppVersion, updateAppVersion } from "@/lib/appVersionApi";
import { isSuperAdminRole } from "@/lib/roles";
import styles from "./app-version.module.css";

const SEMVER_RE = /^\d+(\.\d+){0,2}$/;

function emptyForm() {
  return {
    android_version: "",
    ios_version: "",
    force_update_android: false,
    force_update_ios: false,
  };
}

function fromVersion(version) {
  return {
    android_version: version?.android_version || "",
    ios_version: version?.ios_version || "",
    force_update_android: Number(version?.force_update_android) === 1,
    force_update_ios: Number(version?.force_update_ios) === 1,
  };
}

export default function AppVersionPage() {
  const { user } = useAuth();
  const canManage = isSuperAdminRole(user?.role);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAppVersion();
      setForm(fromVersion(data.version));
    } catch (err) {
      setError(err.message || "Failed to load app version");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    load();
  }, [canManage, load]);

  const onSave = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    const android = form.android_version.trim();
    const ios = form.ios_version.trim();
    if (!SEMVER_RE.test(android)) {
      setError("Android version must look like 1.0.0");
      return;
    }
    if (!SEMVER_RE.test(ios)) {
      setError("iOS version must look like 1.0.0");
      return;
    }

    setBusy(true);
    try {
      const data = await updateAppVersion({
        android_version: android,
        ios_version: ios,
        force_update_android: form.force_update_android ? 1 : 0,
        force_update_ios: form.force_update_ios ? 1 : 0,
      });
      setForm(fromVersion(data.version));
      setOk("App version saved");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Super admin</p>
          <h1 className={styles.title}>App version</h1>
          <p className={styles.copy}>
            Phones compare their installed version with these values on launch.
            Force update blocks anyone still on an older version.
          </p>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <form className={styles.card} onSubmit={onSave}>
          <section className={styles.platform}>
            <h2>Android</h2>
            <label>
              Required version
              <input
                value={form.android_version}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    android_version: e.target.value,
                  }))
                }
                inputMode="decimal"
                autoComplete="off"
                placeholder="1.0.0"
              />
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.force_update_android}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    force_update_android: e.target.checked,
                  }))
                }
              />
              <span>Force update</span>
            </label>
          </section>

          <section className={styles.platform}>
            <h2>iOS</h2>
            <label>
              Required version
              <input
                value={form.ios_version}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ios_version: e.target.value }))
                }
                inputMode="decimal"
                autoComplete="off"
                placeholder="1.0.0"
              />
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.force_update_ios}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    force_update_ios: e.target.checked,
                  }))
                }
              />
              <span>Force update</span>
            </label>
          </section>

          <p className={styles.hint}>
            Leave force update off for the first store release. Turn it on only
            after a newer build is available, and set the required version to
            that build. The iOS build number and Android version code are not
            stored here.
          </p>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
