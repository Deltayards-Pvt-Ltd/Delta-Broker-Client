"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS, navForRole } from "@/lib/nav";
import { NavIcon } from "@/app/component/NavIcon";
import styles from "./Sidebar.module.css";

function isActive(pathname, href) {
  return pathname === href;
}

function sectionOpen(pathname, children) {
  return children.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
  );
}

export default function Sidebar({ open, onClose, persistent }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "broker";
  const items = navForRole(NAV_ITEMS, role);
  const [expanded, setExpanded] = useState({});

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
              DCP
            </span>
            <div className={styles.brandText}>
              <span className={styles.brand}>DCP</span>
              <span className={styles.brandSub}>
                {role === "admin" ? "Admin" : "Channel Partner"}
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
              return (
                <div key={item.id} className={styles.group}>
                  <button
                    type="button"
                    className={`${styles.groupBtn} ${
                      parentActive ? styles.activeParent : ""
                    }`}
                    onClick={() => toggleSection(item.id)}
                    aria-expanded={openSection}
                  >
                    <span className={styles.itemMain}>
                      <span className={styles.iconWrap}>
                        <NavIcon name={item.icon} />
                      </span>
                      {item.label}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.75}
                      className={`${styles.chevron} ${
                        openSection ? styles.chevronOpen : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  <div
                    className={`${styles.sub} ${
                      openSection ? styles.subOpen : ""
                    }`}
                  >
                    <div className={styles.subInner}>
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={`${styles.subLink} ${
                            isActive(pathname, child.href)
                              ? styles.activeSub
                              : ""
                          }`}
                          onClick={handleNav}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.link} ${
                  isActive(pathname, item.href) ? styles.active : ""
                }`}
                onClick={handleNav}
              >
                <span className={styles.iconWrap}>
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
