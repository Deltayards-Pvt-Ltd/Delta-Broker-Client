"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { breadcrumbsFromPath } from "@/lib/breadcrumbs";
import styles from "./Navbar.module.css";

export default function Navbar({ onMenuClick, sidebarOpen, showMenu }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const crumbs = breadcrumbsFromPath(pathname);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const initial = (user?.name || user?.email || "D").charAt(0).toUpperCase();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {showMenu ? (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onMenuClick}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
        ) : null}

        <nav className={styles.crumbs} aria-label="Breadcrumb">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={c.href + i} className={styles.crumbItem}>
                {i > 0 ? <span className={styles.sep}>/</span> : null}
                {last ? (
                  <span className={styles.crumbCurrent}>{c.label}</span>
                ) : (
                  <Link href={c.href} className={styles.crumbLink}>
                    {c.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className={styles.right}>
        <label className={styles.search}>
          <Search size={16} strokeWidth={1.75} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            disabled
            title="Coming soon"
          />
        </label>

        {user ? (
          <div className={styles.userChip} title={user.email}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.userMeta}>
              <span className={styles.userName}>
                {user.name || user.email}
              </span>
              <span className={styles.userRole}>{user.role}</span>
            </span>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
