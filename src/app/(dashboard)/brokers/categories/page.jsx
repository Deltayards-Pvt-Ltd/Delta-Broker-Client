"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import { fetchBrokers } from "@/lib/brokerApi";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategory,
  updateCategory,
  updateCategoryMembers,
} from "@/lib/categoryApi";
import styles from "./categories.module.css";

function emptyForm() {
  return { name: "", description: "" };
}

function CategoriesPageInner() {
  const { user } = useAuth();
  const canManage = isSuperAdminRole(user?.role);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [modal, setModal] = useState(null); // create | edit | members
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);

  // members modal
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchHits, setSearchHits] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [picked, setPicked] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const memberIds = useMemo(
    () => new Set(members.map((b) => String(b._id))),
    [members]
  );

  const openCreate = () => {
    setOk("");
    setError("");
    setSelected(null);
    setForm(emptyForm());
    setModal("create");
  };

  const openEdit = (cat) => {
    setOk("");
    setError("");
    setSelected(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
    });
    setModal("edit");
  };

  const openMembers = async (cat) => {
    setOk("");
    setError("");
    setSelected(cat);
    setMemberSearch("");
    setSearchHits([]);
    setPicked(new Set());
    setModal("members");
    setBusy(true);
    try {
      const data = await fetchCategory(cat._id);
      setMembers(data.brokers || []);
      setSelected(data.category || cat);
    } catch (err) {
      setError(err.message || "Failed to load members");
      setModal(null);
    } finally {
      setBusy(false);
    }
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
    setBusy(true);
    try {
      await createCategory({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setOk("Category created");
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
    if (!form.name.trim()) return setError("Name is required");
    setBusy(true);
    try {
      await updateCategory(selected._id, {
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setOk("Category updated");
      setModal(null);
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (cat) => {
    if (
      !confirm(
        `Delete category "${cat.name}"? Brokers stay — they just leave this group.`
      )
    ) {
      return;
    }
    setError("");
    try {
      await deleteCategory(cat._id);
      setOk("Category deleted");
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  useEffect(() => {
    if (modal !== "members") return;
    const q = memberSearch.trim();
    if (q.length < 2) {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchBusy(true);
      try {
        const data = await fetchBrokers({ status: "approved", q, limit: 20 });
        if (!cancelled) setSearchHits(data.brokers || []);
      } catch {
        if (!cancelled) setSearchHits([]);
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [memberSearch, modal]);

  const togglePick = (id) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addPicked = async () => {
    if (!selected || picked.size === 0) return;
    setBusy(true);
    setError("");
    try {
      const data = await updateCategoryMembers(selected._id, {
        brokerIds: [...picked],
        action: "add",
      });
      setMembers(data.brokers || []);
      setSelected(data.category || selected);
      setPicked(new Set());
      setOk(data.message || "Brokers added");
      await load();
    } catch (err) {
      setError(err.message || "Add failed");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (brokerId) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const data = await updateCategoryMembers(selected._id, {
        brokerIds: [brokerId],
        action: "remove",
      });
      setMembers(data.brokers || []);
      setSelected(data.category || selected);
      setOk(data.message || "Broker removed");
      await load();
    } catch (err) {
      setError(err.message || "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Super admin only.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Brokers</p>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.copy}>
            Group partners for targeted broadcasts. Assign members here or from
            broker edit.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={18} strokeWidth={2.25} />
          New category
        </button>
      </header>

      {error && !modal ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {ok && !modal ? <p className={styles.ok}>{ok}</p> : null}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>No categories yet. Create one to start grouping brokers.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Members</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td className={styles.nameCell}>{cat.name}</td>
                  <td className={styles.muted}>
                    {cat.description || "—"}
                  </td>
                  <td>
                    <span className={styles.badge}>{cat.brokerCount ?? 0}</span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openMembers(cat)}
                      >
                        <Users size={14} />
                        Members
                      </button>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => onDelete(cat)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "create" || modal === "edit" ? (
        <div className={styles.overlay} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close"
            onClick={closeModal}
          />
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h2 className={styles.modalTitle}>
              {modal === "create" ? "New category" : "Edit category"}
            </h2>
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
                  placeholder="e.g. Pune CP Meet"
                  disabled={busy}
                  autoFocus
                />
              </label>
              <label>
                Description
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional"
                  disabled={busy}
                />
              </label>
              {error && modal !== "members" ? (
                <p className={styles.error}>{error}</p>
              ) : null}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={closeModal}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={busy}
                >
                  {busy ? "Saving…" : modal === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "members" && selected ? (
        <div className={styles.overlay} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close"
            onClick={closeModal}
          />
          <div
            className={`${styles.modal} ${styles.membersModal}`}
            role="dialog"
            aria-modal="true"
          >
            <h2 className={styles.modalTitle}>{selected.name} · members</h2>
            <p className={styles.hint}>
              Search approved brokers and add them. Remove from the list below.
            </p>

            <label className={styles.searchLabel}>
              Search brokers
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Name, phone, email…"
                disabled={busy}
              />
            </label>

            {searchBusy ? (
              <p className={styles.muted}>Searching…</p>
            ) : searchHits.length > 0 ? (
              <ul className={styles.pickList}>
                {searchHits.map((b) => {
                  const id = String(b._id);
                  const already = memberIds.has(id);
                  return (
                    <li key={id}>
                      <label className={styles.pickRow}>
                        <input
                          type="checkbox"
                          checked={already || picked.has(id)}
                          disabled={already || busy}
                          onChange={() => togglePick(id)}
                        />
                        <span>
                          <strong>{b.name}</strong>
                          <span className={styles.pickMeta}>
                            {b.phone}
                            {b.firmName ? ` · ${b.firmName}` : ""}
                          </span>
                        </span>
                        {already ? (
                          <span className={styles.inBadge}>In category</span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : memberSearch.trim().length >= 2 ? (
              <p className={styles.muted}>No matches</p>
            ) : null}

            {picked.size > 0 ? (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={addPicked}
                disabled={busy}
              >
                Add {picked.size} selected
              </button>
            ) : null}

            <h3 className={styles.subhead}>
              Current members ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className={styles.muted}>No brokers in this category yet.</p>
            ) : (
              <ul className={styles.memberList}>
                {members.map((b) => (
                  <li key={b._id} className={styles.memberRow}>
                    <span>
                      <strong>{b.name}</strong>
                      <span className={styles.pickMeta}>
                        {b.phone}
                        {b.firmName ? ` · ${b.firmName}` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => removeMember(b._id)}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error && modal === "members" ? (
              <p className={styles.error}>{error}</p>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={closeModal}
                disabled={busy}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
      <CategoriesPageInner />
    </Suspense>
  );
}
