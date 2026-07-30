"use client";

import {
  BadgeCheck,
  FileText,
  Home,
  Megaphone,
  PartyPopper,
  Settings,
  Trash2,
  Users,
  UserPlus,
} from "lucide-react";
import styles from "./FeedCard.module.css";

const KIND_META = {
  general: { label: "GENERAL", Icon: Megaphone },
  cp_meet: { label: "CP MEET", Icon: Users },
  project: { label: "NEW PROJECT", Icon: Home },
  policy: { label: "POLICY", Icon: FileText },
  system: { label: "SYSTEM", Icon: Settings },
};

const TYPE_META = {
  approvalRequired: { label: "APPROVAL", Icon: UserPlus },
  welcome: { label: "WELCOME", Icon: PartyPopper },
  approved: { label: "APPROVED", Icon: BadgeCheck },
  broadcast: { label: "BROADCAST", Icon: Megaphone },
};

export function relativeTime(date) {
  if (!date) return "";
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function metaFromBroadcast(item) {
  const kind = item?.kind || "general";
  const meta = KIND_META[kind] || KIND_META.general;
  return {
    label: String(item?.kindLabel || meta.label).toUpperCase(),
    Icon: meta.Icon,
    link: item?.link || "",
    unread: false,
  };
}

export function metaFromUpdate(item) {
  const kind = item?.meta?.kind;
  if (item?.type === "broadcast" && kind && KIND_META[kind]) {
    return {
      label: KIND_META[kind].label,
      Icon: KIND_META[kind].Icon,
      link: item?.meta?.link || "",
      unread: !item.read,
    };
  }
  const meta = TYPE_META[item?.type] || TYPE_META.broadcast;
  return {
    label: meta.label,
    Icon: meta.Icon,
    link: item?.meta?.link || "",
    unread: !item.read,
  };
}

export default function FeedCard({
  category,
  Icon,
  title,
  message,
  createdAt,
  link,
  unread = false,
  onClick,
  onDelete,
  onOpenLink,
}) {
  const IconComp = Icon || Megaphone;

  return (
    <div
      className={`${styles.card} ${unread ? styles.unread : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      {unread ? <span className={styles.accent} aria-hidden /> : null}
      <div className={styles.iconBox}>
        <IconComp size={18} strokeWidth={1.75} />
      </div>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <div className={styles.categoryRow}>
            <span className={styles.category}>{category}</span>
            {unread ? <span className={styles.dot} aria-label="Unread" /> : null}
          </div>
          <div className={styles.metaRight}>
            <span className={styles.time}>{relativeTime(createdAt)}</span>
            {onDelete ? (
              <button
                type="button"
                className={styles.deleteBtn}
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
        <p className={styles.title}>{title}</p>
        {message ? <p className={styles.msg}>{message}</p> : null}
        {link ? (
          <button
            type="button"
            className={styles.link}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenLink) onOpenLink(link);
              else if (/^https?:\/\//i.test(link)) {
                window.open(link, "_blank", "noopener,noreferrer");
              }
            }}
          >
            Open link <span aria-hidden>↗</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
