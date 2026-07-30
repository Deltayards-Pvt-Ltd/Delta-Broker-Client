"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  X,
  Clock,
  ShieldAlert,
  PartyPopper,
  BadgeCheck,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "@/lib/notificationApi";
import styles from "./NotificationPanel.module.css";

const PAGE_SIZE = 10;

function timeLabel(date) {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeIcon(type) {
  if (type === "approvalRequired") return ShieldAlert;
  if (type === "welcome") return PartyPopper;
  if (type === "approved") return BadgeCheck;
  if (type === "broadcast") return Bell;
  return Bell;
}

export default function NotificationPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadUnread = useCallback(async () => {
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await fetchNotifications(p, PAGE_SIZE);
      setItems(data.notifications || []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 60000);
    return () => clearInterval(t);
  }, [loadUnread]);

  useEffect(() => {
    if (open) loadPage(1);
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onReadAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const onRefresh = () => loadPage(page);

  const onClickItem = async (n) => {
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
    const href = notificationHref(n);
    setOpen(false);
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.overlay} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="All Notifications"
          >
            <div className={styles.head}>
              <div className={styles.headLeft}>
                <span className={styles.headIcon}>
                  <Bell size={20} strokeWidth={2} />
                </span>
                <h2 className={styles.title}>All Notifications</h2>
                {unreadCount > 0 ? (
                  <span className={styles.unreadPill}>
                    {unreadCount} Unread
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.iconClose}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.list}>
              {loading ? (
                <p className={styles.muted}>Loading…</p>
              ) : items.length === 0 ? (
                <p className={styles.muted}>No notifications yet.</p>
              ) : (
                items.map((n) => {
                  const Icon = typeIcon(n.type);
                  return (
                    <button
                      key={n._id}
                      type="button"
                      className={`${styles.card} ${
                        n.read ? "" : styles.cardUnread
                      }`}
                      onClick={() => onClickItem(n)}
                    >
                      <span className={styles.cardIcon}>
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <div className={styles.cardBody}>
                        <div className={styles.cardTop}>
                          <span className={styles.cardTitle}>{n.title}</span>
                          {!n.read ? (
                            <span className={styles.dot} aria-label="Unread" />
                          ) : null}
                        </div>
                        <p className={styles.cardMsg}>{n.message}</p>
                        <div className={styles.cardMeta}>
                          <Clock size={13} strokeWidth={2} />
                          <span>{timeLabel(n.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {totalPages > 1 ? (
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={page <= 1 || loading}
                  onClick={() => loadPage(page - 1)}
                >
                  Prev
                </button>
                <span className={styles.pagerMeta}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  disabled={page >= totalPages || loading}
                  onClick={() => loadPage(page + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={onReadAll}
                disabled={busy || unreadCount === 0}
              >
                <CheckCheck size={16} strokeWidth={2} />
                Mark All as Read
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw size={16} strokeWidth={2} />
                Refresh
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
