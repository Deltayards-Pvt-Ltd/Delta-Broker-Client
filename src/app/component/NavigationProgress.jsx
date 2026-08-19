"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { doneNav, startNav, subscribeNav } from "@/lib/navProgress";
import styles from "./NavigationProgress.module.css";

function isModifiedClick(e) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function shouldStartForAnchor(a, pathname) {
  if (!a || a.hasAttribute("download")) return false;
  if (a.target && a.target !== "_self") return false;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  let url;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) return false;
  if (url.pathname === pathname && url.search === window.location.search) return false;
  return true;
}

export default function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => subscribeNav(setPending), []);

  useEffect(() => {
    doneNav();
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || isModifiedClick(e)) return;
      const a = e.target?.closest?.("a[href]");
      if (!shouldStartForAnchor(a, pathname)) return;
      startNav();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", startNav);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", startNav);
    };
  }, [pathname]);

  useEffect(() => {
    if (!pending) return undefined;
    const t = setTimeout(() => doneNav(), 12000);
    return () => clearTimeout(t);
  }, [pending]);

  if (!pending) return null;

  return (
    <>
      <div className={styles.bar} aria-hidden>
        <div className={styles.barFill} />
      </div>
      <div className={styles.veil} role="status" aria-label="Loading" aria-busy="true">
        <span className={styles.spinner} />
      </div>
    </>
  );
}
