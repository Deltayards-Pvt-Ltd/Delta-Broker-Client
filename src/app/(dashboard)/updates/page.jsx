"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, RefreshCw } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "@/lib/notificationApi";
import UpdateDetailModal from "@/app/component/UpdateDetailModal";
import Pagination from "@/app/component/Pagination";
import styles from "./updates.module.css";

function timeLabel(date) {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 10;

export default function UpdatesPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotifications(page, limit);
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotal(data.total ?? data.count ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load updates");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const onOpen = async (n) => {
    setSelected(n);
    if (!n.read) {
      try {
        await markNotificationRead(n._id);
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "Could not mark all read");
    }
  };

  const openLink = () => {
    if (!selected) return;
    const href = notificationHref(selected) || selected.meta?.link;
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    setSelected(null);
    router.push(href);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Partner</p>
          <h1 className={styles.title}>Updates</h1>
          <p className={styles.copy}>
            System notices and broadcasts from Delta Yards
          </p>
        </div>
        <div className={styles.actions}>
          {unreadCount > 0 ? (
            <span className={styles.unreadPill}>{unreadCount} unread</span>
          ) : null}
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={onMarkAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} strokeWidth={2} />
            Mark all read
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={16} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>No updates yet.</div>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                className={`${styles.item} ${n.read ? "" : styles.itemUnread}`}
                onClick={() => onOpen(n)}
              >
                <div className={styles.itemTop}>
                  <p className={styles.itemTitle}>{n.title}</p>
                  <span className={styles.meta}>{timeLabel(n.createdAt)}</span>
                  {!n.read ? <span className={styles.dot} aria-label="Unread" /> : null}
                </div>
                <p className={styles.itemBody}>{n.message}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && total > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next);
            setPage(1);
          }}
          disabled={loading}
        />
      ) : null}

      <UpdateDetailModal
        open={Boolean(selected)}
        item={
          selected
            ? {
                ...selected,
                link: selected.meta?.link || "",
              }
            : null
        }
        onClose={() => setSelected(null)}
        footer={
          selected && (selected.meta?.link || notificationHref(selected)) ? (
            <button type="button" className={styles.openLink} onClick={openLink}>
              Open related
            </button>
          ) : null
        }
      />
    </div>
  );
}
