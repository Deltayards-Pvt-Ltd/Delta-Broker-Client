"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS, navForRole } from "@/lib/nav";
import { isStaffRole, staffLabel } from "@/lib/roles";
import { NavIcon } from "@/app/component/NavIcon";
import { useStaffPendingCount } from "@/lib/usePendingCount";
import styles from "./Sidebar.module.css";

function isActive(pathname, href) {
  return pathname === href;
}

function sectionOpen(pathname, children) {
  return children.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
  );
}

function CountBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className={styles.badge}>{count > 99 ? "99+" : count}</span>
  );
}

export default function Sidebar({ open, onClose, persistent }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "broker";
  const items = navForRole(NAV_ITEMS, role);
  const [expanded, setExpanded] = useState({});
  const pending = useStaffPendingCount(user, { fetchOnMount: true });

  useEffect(() => {
    const next = {};
    for (const item of items) {
      if (item.children && sectionOpen(pathname, item.children)) {
        next[item.id] = true;
      }
    }
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [pathname, role]);

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNav = () => {
    if (!persistent) onClose?.();
  };

  const badgeFor = (item) => {
    if (item.id === "approvals") return pending;
    if (item.id === "brokers") return pending;
    return 0;
  };

  const badgeForChild = (child) => {
    if (child.id === "brokers-pending") return pending;
    return 0;
  };

  return (
    <>
      {!persistent ? (
        <div
          className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
          onClick={onClose}
          aria-hidden={!open}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""} ${
          persistent ? styles.sidebarPersistent : ""
        }`}
        aria-hidden={!open}
      >
        <div className={styles.head}>
          <div className={styles.brandBlock}>
            <span className={styles.logoMark} aria-hidden>
              <img
                src="/new_logo.png"
                alt=""
                className={styles.logoImg}
                width={28}
                height={28}
              />
            </span>
            <div className={styles.brandText}>
              <span className={styles.brand}>DELTA YARDS</span>
              <span className={styles.brandSub}>
                {isStaffRole(role) ? staffLabel(role) : "Channel Partner"}
              </span>
            </div>
          </div>
          {!persistent ? (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        <nav className={styles.nav} aria-label="Main">
          <p className={styles.sectionLabel}>Navigation</p>
          {items.map((item) => {
            if (item.children?.length) {
              const openSection = Boolean(expanded[item.id]);
              const parentActive = sectionOpen(pathname, item.children);
              const parentBadge = badgeFor(item);
              return (
                <div key={item.id} className={styles.group}>
                  <button
                    type="button"
                    className={`${styles.groupBtn} ${
                      parentActive ? styles.activeParent : ""
                    } ${parentBadge > 0 ? styles.hasBadge : ""}`}
                    onClick={() => toggleSection(item.id)}
                    aria-expanded={openSection}
                  >
                    <span className={styles.itemMain}>
                      <span className={styles.iconWrap}>
                        <NavIcon name={item.icon} />
                      </span>
                      {item.label}
                    </span>
                    <span className={styles.itemEnd}>
                      <CountBadge count={parentBadge} />
                      <ChevronDown
                        size={16}
                        strokeWidth={1.75}
                        className={`${styles.chevron} ${
                          openSection ? styles.chevronOpen : ""
                        }`}
                        aria-hidden
                      />
                    </span>
                  </button>

                  <div
                    className={`${styles.sub} ${
                      openSection ? styles.subOpen : ""
                    }`}
                  >
                    <div className={styles.subInner}>
                      {item.children.map((child) => {
                        const childBadge = badgeForChild(child);
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`${styles.subLink} ${
                              isActive(pathname, child.href)
                                ? styles.activeSub
                                : ""
                            } ${childBadge > 0 ? styles.hasBadge : ""}`}
                            onClick={handleNav}
                          >
                            <span>{child.label}</span>
                            <CountBadge count={childBadge} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const itemBadge = badgeFor(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.link} ${
                  isActive(pathname, item.href) ? styles.active : ""
                } ${itemBadge > 0 ? styles.hasBadge : ""}`}
                onClick={handleNav}
              >
                <span className={styles.iconWrap}>
                  <NavIcon name={item.icon} />
                </span>
                <span className={styles.linkLabel}>{item.label}</span>
                <CountBadge count={itemBadge} />
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
