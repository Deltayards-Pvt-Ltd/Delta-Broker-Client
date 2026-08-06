"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createAdmin,
  deleteAdmin,
  fetchAdmins,
  resetAdminPassword,
  updateAdmin,
} from "@/lib/adminApi";
import { isValidAdminPin, isValidPhone } from "@/lib/loginApi";
import { ROLES, isSuperAdminRole, staffLabel } from "@/lib/roles";
import styles from "./admins.module.css";

function emptyForm() {
  return {
    name: "",
    phone: "",
    email: "",
    password: "",
    role: ROLES.ADMIN,
    status: "active",
  };
}

function AdminsPageInner() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [modal, setModal] = useState(null); // create | edit | reset
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdmins();
      setAdmins(data.admins || []);
    } catch (err) {
      setError(err.message || "Failed to load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setOk("");
    setError("");
    setSelected(null);
    setForm(emptyForm());
    setModal("create");
  };

  const openEdit = (admin) => {
    setOk("");
    setError("");
    setSelected(admin);
    setForm({
      name: admin.name || "",
      phone: admin.phone || "",
      email: admin.email || "",
      password: "",
      role: admin.role || ROLES.ADMIN,
      status: admin.status || "active",
    });
    setModal("edit");
  };

  const openReset = (admin) => {
    setOk("");
    setError("");
    setSelected(admin);
    setForm({ ...emptyForm(), password: "" });
    setModal("reset");
  };

  const closeModal = () => {
    if (busy) return;
    setModal(null);
    setSelected(null);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    if (!isValidPhone(form.phone)) return setError("Enter a valid 10-digit phone");
    if (!isValidAdminPin(form.password)) {
      return setError("Password must be exactly 4 digits");
    }
    setBusy(true);
    try {
      await createAdmin({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        role: form.role,
      });
      setOk("Admin created");
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setBusy(true);
    try {
      await updateAdmin(selected._id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
      });
      setOk("Admin updated");
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError("");
    if (!isValidAdminPin(form.password)) {
      return setError("Password must be exactly 4 digits");
    }
    setBusy(true);
    try {
      await resetAdminPassword(selected._id, form.password);
      setOk("Password reset. They will be asked to update it on next login.");
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (admin) => {
    if (String(admin._id) === String(user?.id || user?._id)) {
      setError("Cannot delete your own account");
      return;
    }
    if (!confirm(`Delete ${admin.name}? This cannot be undone.`)) return;
    setError("");
    try {
      await deleteAdmin(admin._id);
      setOk("Admin deleted");
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Super admin</p>
          <h1 className={styles.title}>Admins</h1>
          <p className={styles.copy}>
            Create staff accounts, reset passwords, manage roles
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={18} strokeWidth={2.5} />
          Add admin
        </button>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}
      {loading ? <p className={styles.muted}>Loading…</p> : null}

      {!loading && admins.length === 0 ? (
        <div className={styles.empty}>No admins yet.</div>
      ) : null}

      {!loading && admins.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Reset flag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>
                    <span className={styles.nameCell}>{a.name}</span>
                  </td>
                  <td>{a.phone}</td>
                  <td>{a.email || "—"}</td>
                  <td>{staffLabel(a.role)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${styles[a.status] || ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.passwordResetBySuperAdmin ? (
                      <span className={styles.flag}>Pending update</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openEdit(a)}
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openReset(a)}
                      >
                        <KeyRound size={14} strokeWidth={1.75} />
                        Reset
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => onDelete(a)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {modal ? (
        <div className={styles.overlay} role="presentation" onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>
              {modal === "create"
                ? "Add admin"
                : modal === "edit"
                  ? "Edit admin"
                  : `Reset password · ${selected?.name || ""}`}
            </h2>

            {modal === "reset" ? (
              <form className={styles.form} onSubmit={onReset}>
                <label>
                  Temporary 4-digit password
                  <input
                    type="password"
                    inputMode="numeric"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        password: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    required
                  />
                </label>
                <p className={styles.hint}>
                  They can sign in with this PIN, then update or skip.
                </p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.ghostBtn} onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={busy}>
                    {busy ? "Saving…" : "Reset password"}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className={styles.form}
                onSubmit={modal === "create" ? onCreate : onEdit}
              >
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Email (optional)
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </label>
                {modal === "create" ? (
                  <label>
                    Temporary password (4 digits)
                    <input
                      type="password"
                      inputMode="numeric"
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          password: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4),
                        }))
                      }
                      required
                    />
                  </label>
                ) : null}
                <label>
                  Role
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.SUPER_ADMIN}>Super admin</option>
                  </select>
                </label>
                {modal === "edit" ? (
                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                ) : null}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={busy}
                  >
                    {busy
                      ? "Saving…"
                      : modal === "create"
                        ? "Create"
                        : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminsPage() {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: "2rem" }}>Loading…</p>;
  if (!isSuperAdminRole(user?.role)) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Super admin access required.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<p style={{ padding: "2rem" }}>Loading…</p>}>
      <AdminsPageInner />
    </Suspense>
  );
}
