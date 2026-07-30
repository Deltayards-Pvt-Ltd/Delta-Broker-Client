"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { fetchBrokers } from "@/lib/brokerApi";
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

export default function BrokerListPage({
  title,
  status,
  eyebrow = "Brokers",
  emptyText = "No brokers found.",
}) {
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
        status || (statusFilter !== "all" ? statusFilter : undefined);
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
    setBrokers((prev) =>
      prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
    );
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
                  <th>Actions</th>
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
                          {b.status}
                        </span>
                      </td>
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

      <BrokerEditModal
        broker={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />
    </div>
  );
}
