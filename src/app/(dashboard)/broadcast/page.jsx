"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Megaphone, Plus } from "lucide-react";
import { deleteBroadcast, fetchBroadcasts } from "@/lib/broadcastApi";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "@/lib/notificationApi";
import UpdateDetailModal from "@/app/component/UpdateDetailModal";
import SendBroadcastModal from "@/app/component/SendBroadcastModal";
import Pagination from "@/app/component/Pagination";
import styles from "./broadcast.module.css";

const PAGE_SIZE = 10;

function timeLabel(date, short = false) {
  if (!date) return "";
  if (short) {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date(date).toLocaleString();
}

export default function BroadcastPage() {
  const router = useRouter();
  const [mode, setMode] = useState("broadcast"); // broadcast | updates

  // ── Broadcast (outbox) ──
  const [sent, setSent] = useState([]);
  const [bPage, setBPage] = useState(1);
  const [bLimit, setBLimit] = useState(PAGE_SIZE);
  const [bTotal, setBTotal] = useState(0);
  const [bTotalPages, setBTotalPages] = useState(1);
  const [bLoading, setBLoading] = useState(true);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

  // ── Updates (admin inbox) ──
  const [updates, setUpdates] = useState([]);
  const [uPage, setUPage] = useState(1);
  const [uLimit, setULimit] = useState(PAGE_SIZE);
  const [uTotal, setUTotal] = useState(0);
  const [uTotalPages, setUTotalPages] = useState(1);
  const [uLoading, setULoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const loadBroadcasts = useCallback(async () => {
    setBLoading(true);
    setError("");
    try {
      const data = await fetchBroadcasts(bPage, bLimit);
      setSent(data.broadcasts || []);
      setBTotal(data.total ?? 0);
      setBTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load broadcasts");
      setSent([]);
    } finally {
      setBLoading(false);
    }
  }, [bPage, bLimit]);

  const loadUpdates = useCallback(async () => {
    setULoading(true);
    setError("");
    try {
      const data = await fetchNotifications(uPage, uLimit);
      setUpdates(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setUTotal(data.total ?? 0);
      setUTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load updates");
      setUpdates([]);
    } finally {
      setULoading(false);
    }
  }, [uPage, uLimit]);

  useEffect(() => {
    if (mode === "broadcast") loadBroadcasts();
  }, [mode, loadBroadcasts]);

  useEffect(() => {
    if (mode === "updates") loadUpdates();
  }, [mode, loadUpdates]);

  // Prefetch unread badge for Updates tab
  useEffect(() => {
    fetchNotifications(1, 1)
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  const onDelete = async (id) => {
    if (!confirm("Delete this broadcast and related partner inbox items?")) return;
    setError("");
    try {
      await deleteBroadcast(id);
      if (sent.length === 1 && bPage > 1) {
        setBPage((p) => p - 1);
      } else {
        await loadBroadcasts();
      }
      if (selectedBroadcast?._id === id) setSelectedBroadcast(null);
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const onSent = (data) => {
    setOk(data?.message || "Broadcast sent");
    setBPage(1);
    if (bPage === 1) loadBroadcasts();
  };

  const onOpenUpdate = async (n) => {
    setSelectedUpdate(n);
    if (!n.read) {
      try {
        await markNotificationRead(n._id);
        setUpdates((prev) =>
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
      setUpdates((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "Could not mark all read");
    }
  };

  const openRelated = () => {
    if (!selectedUpdate) return;
    const href = notificationHref(selectedUpdate) || selectedUpdate.meta?.link;
    setSelectedUpdate(null);
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Broadcast</h1>
          <p className={styles.copy}>
            Send partner updates, or review approval notices
          </p>
        </div>
        {mode === "broadcast" ? (
          <button
            type="button"
            className={styles.sendBtn}
            onClick={() => {
              setOk("");
              setComposerOpen(true);
            }}
            aria-label="Send broadcast"
          >
            <Plus size={18} strokeWidth={2.5} />
            New broadcast
          </button>
        ) : (
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={onMarkAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} strokeWidth={2} />
            Mark all read
          </button>
        )}
      </header>

      <div className={styles.segment} role="tablist" aria-label="Broadcast sections">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "broadcast"}
          className={`${styles.segmentBtn} ${
            mode === "broadcast" ? styles.segmentActive : ""
          }`}
          onClick={() => {
            setError("");
            setOk("");
            setMode("broadcast");
          }}
        >
          <Megaphone size={15} strokeWidth={2} />
          Broadcast
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "updates"}
          className={`${styles.segmentBtn} ${
            mode === "updates" ? styles.segmentActive : ""
          }`}
          onClick={() => {
            setError("");
            setOk("");
            setMode("updates");
          }}
        >
          Updates
          {unreadCount > 0 ? (
            <span className={styles.tabBadge}>{unreadCount}</span>
          ) : null}
        </button>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {ok && mode === "broadcast" ? <p className={styles.ok}>{ok}</p> : null}

      {mode === "broadcast" ? (
        <section className={styles.panel} aria-label="Sent broadcasts">
          {bLoading ? (
            <p className={styles.empty}>Loading…</p>
          ) : sent.length === 0 ? (
            <div className={styles.empty}>No broadcasts sent yet.</div>
          ) : (
            <ul className={styles.list}>
              {sent.map((b) => (
                <li key={b._id} className={styles.row}>
                  <button
                    type="button"
                    className={styles.rowMain}
                    onClick={() => setSelectedBroadcast(b)}
                  >
                    <span className={styles.rowTitle}>{b.title}</span>
                    <span className={styles.rowDate}>
                      {b.createdAt ? timeLabel(b.createdAt, true) : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.delete}
                    onClick={() => onDelete(b._id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!bLoading && bTotal > 0 ? (
            <Pagination
              page={bPage}
              totalPages={bTotalPages}
              total={bTotal}
              limit={bLimit}
              onPageChange={setBPage}
              onLimitChange={(next) => {
                setBLimit(next);
                setBPage(1);
              }}
              disabled={bLoading}
            />
          ) : null}
        </section>
      ) : (
        <section className={styles.panel} aria-label="Admin updates">
          {unreadCount > 0 ? (
            <p className={styles.unreadLine}>
              <span className={styles.unreadPill}>{unreadCount} unread</span>
            </p>
          ) : null}

          {uLoading ? (
            <p className={styles.empty}>Loading…</p>
          ) : updates.length === 0 ? (
            <div className={styles.empty}>No updates yet.</div>
          ) : (
            <ul className={styles.list}>
              {updates.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    className={`${styles.updateItem} ${
                      n.read ? "" : styles.updateUnread
                    }`}
                    onClick={() => onOpenUpdate(n)}
                  >
                    <div className={styles.updateTop}>
                      <span className={styles.rowTitle}>{n.title}</span>
                      <span className={styles.rowDate}>
                        {n.createdAt ? timeLabel(n.createdAt, true) : ""}
                      </span>
                      {!n.read ? (
                        <span className={styles.dot} aria-label="Unread" />
                      ) : null}
                    </div>
                    {n.message ? (
                      <p className={styles.updateMsg}>{n.message}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!uLoading && uTotal > 0 ? (
            <Pagination
              page={uPage}
              totalPages={uTotalPages}
              total={uTotal}
              limit={uLimit}
              onPageChange={setUPage}
              onLimitChange={(next) => {
                setULimit(next);
                setUPage(1);
              }}
              disabled={uLoading}
            />
          ) : null}
        </section>
      )}

      <SendBroadcastModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSent={onSent}
      />

      <UpdateDetailModal
        open={Boolean(selectedBroadcast)}
        item={selectedBroadcast}
        kindLabel={selectedBroadcast?.kindLabel || selectedBroadcast?.kind || ""}
        onClose={() => setSelectedBroadcast(null)}
      />

      <UpdateDetailModal
        open={Boolean(selectedUpdate)}
        item={
          selectedUpdate
            ? { ...selectedUpdate, link: selectedUpdate.meta?.link || "" }
            : null
        }
        onClose={() => setSelectedUpdate(null)}
        footer={
          selectedUpdate &&
          (selectedUpdate.meta?.link || notificationHref(selectedUpdate)) ? (
            <button
              type="button"
              className={styles.openLink}
              onClick={openRelated}
            >
              Open related
            </button>
          ) : null
        }
      />
    </div>
  );
}
