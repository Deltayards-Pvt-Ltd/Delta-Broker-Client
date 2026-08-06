"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/component/AuthGuard";
import RoleGuard from "@/app/component/RoleGuard";
import Navbar from "@/app/component/Navbar";
import Sidebar from "@/app/component/Sidebar";
import { useTheme } from "@/context/ThemeContext";
import styles from "./AppShell.module.css";

export default function AppShell({ children }) {
  const { isLight } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <AuthGuard>
      <RoleGuard>
        <div
          className={`${styles.shell} ${
            isLight ? styles.shellLight : styles.shellDark
          }`}
        >
          <Sidebar
            open={desktop || sidebarOpen}
            onClose={closeSidebar}
            persistent={desktop}
          />
          <div className={styles.main}>
            <Navbar
              onMenuClick={toggleSidebar}
              sidebarOpen={sidebarOpen}
              showMenu={!desktop}
            />
            <main className={styles.content}>
              <div className={styles.contentInner}>{children}</div>
            </main>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
