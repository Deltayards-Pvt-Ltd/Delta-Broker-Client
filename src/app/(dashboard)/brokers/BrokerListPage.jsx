"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import { fetchBrokers, disableBroker, enableBroker } from "@/lib/brokerApi";
import Pagination from "@/app/component/Pagination";
import BrokerEditModal from "@/app/component/BrokerEditModal";
import styles from "./brokers.module.css";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return `+91 ${phone}`;
}

function canToggleAccess(status) {
  return status === "approved" || status === "active" || status === "inactive";
}

function isEnabledStatus(status) {
  return status === "approved" || status === "active";
}

export default function BrokerListPage({
  title,
  status,
  eyebrow = "Brokers",
  emptyText = "No brokers found.",
}) {
  const { user } = useAuth();
  const canEdit = isSuperAdminRole(user?.role);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, statusFilter, status, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const effectiveStatus =
        status || (statusFilter !== "all" ? statusFilter : "all");
      const data = await fetchBrokers({
        status: effectiveStatus,
        page,
        limit,
        q: debouncedQ || undefined,
      });
      setBrokers(data.brokers || []);
      setTotal(data.count ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load");
      setBrokers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [status, statusFilter, page, limit, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const showStatusFilter = !status;

  const onSaved = (updated) => {
    if (!updated?._id) {
      load();
      return;
    }
    applyBrokerUpdate(updated, { mergeAll: true });
  };

  const applyBrokerUpdate = (updated, { mergeAll = false } = {}) => {
    const nextStatus = updated.status;
    const pageStatus = status || (statusFilter !== "all" ? statusFilter : null);
    const stillMatches =
      !pageStatus ||
      nextStatus === pageStatus ||
      (pageStatus === "approved" &&
        (nextStatus === "approved" || nextStatus === "active"));

    setBrokers((prev) => {
      if (!stillMatches) return prev.filter((b) => b._id !== updated._id);
      return prev.map((b) =>
        b._id === updated._id
          ? mergeAll
            ? { ...b, ...updated }
            : { ...b, status: nextStatus }
          : b
      );
    });
    if (!stillMatches) {
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  const onToggleAccess = async (broker) => {
    if (!canToggleAccess(broker.status) || togglingId) return;
    const enabling = broker.status === "inactive";
    const ok = window.confirm(
      enabling
        ? `Enable ${broker.name || "this broker"}? They will be able to log in and receive notifications again.`
        : `Disable ${broker.name || "this broker"}? They will not be able to log in or receive notifications.`
    );
    if (!ok) return;

    setTogglingId(broker._id);
    setError("");
    try {
      const data = enabling
        ? await enableBroker(broker._id)
        : await disableBroker(broker._id);
      if (data.broker) applyBrokerUpdate(data.broker);
    } catch (err) {
      setError(err.message || "Failed to update broker access");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search name, ID, RERA, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {showStatusFilter ? (
          <select
            className={styles.filter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Loading…</p> : null}

      {!loading && !error && total === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : null}

      {!loading && brokers.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Membership ID</th>
                  <th>RERA</th>
                  <th>Phone</th>
                  <th>Member since</th>
                  <th>Valid till</th>
                  <th>Status</th>
                  {canEdit ? <th>Access</th> : null}
                  {canEdit ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {brokers.map((b) => {
                  const firm =
                    b.partnerType === "company"
                      ? b.firmName || "Company"
                      : b.firmName || "Individual";
                  return (
                    <tr key={b._id}>
                      <td>
                        <div className={styles.partnerCell}>
                          <span className={styles.nameCell}>{b.name}</span>
                          <span className={styles.subCell}>{firm}</span>
                          {b.email ? (
                            <span className={styles.subCell}>{b.email}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={styles.idCell}>
                          {b.membershipId || "—"}
                        </span>
                      </td>
                      <td>{b.maharera || "—"}</td>
                      <td>{formatPhone(b.phone)}</td>
                      <td>{formatDate(b.membershipValidFrom)}</td>
                      <td>{formatDate(b.membershipValidTill)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${styles[b.status] || ""}`}
                        >
                          {b.status === "inactive" ? "disabled" : b.status}
                        </span>
                      </td>
                      {canEdit ? (
                        <td>
                          {canToggleAccess(b.status) ? (
                            <button
                              type="button"
                              className={`${styles.switch} ${
                                isEnabledStatus(b.status) ? styles.switchOn : ""
                              }`}
                              onClick={() => onToggleAccess(b)}
                              disabled={Boolean(togglingId)}
                              aria-pressed={isEnabledStatus(b.status)}
                              aria-label={
                                isEnabledStatus(b.status)
                                  ? `Disable ${b.name || "broker"}`
                                  : `Enable ${b.name || "broker"}`
                              }
                              title={
                                isEnabledStatus(b.status)
                                  ? "Disable — no login, no notifications"
                                  : "Enable — restore login and notifications"
                              }
                            >
                              <span className={styles.switchKnob} />
                            </button>
                          ) : (
                            <span className={styles.muted}>—</span>
                          )}
                        </td>
                      ) : null}
                      {canEdit ? (
                        <td>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => setEditing(b)}
                            aria-label={`Edit ${b.name || "broker"}`}
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                            Edit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            disabled={loading}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      ) : null}

      {canEdit ? (
        <BrokerEditModal
          broker={editing}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
