"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  UserCheck,
  Clock,
  ArrowUpRight,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { isStaffRole, isSuperAdminRole } from "@/lib/roles";
import MembershipCard from "@/app/component/MembershipCard";
import { fetchDashboardSummary } from "@/lib/dashboardApi";
import {
  publishPendingFromSummary,
  useStaffPendingCount,
} from "@/lib/usePendingCount";
import styles from "./page.module.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({ href = null, icon: Icon, label, value, hint, tone, card }) {
  const inner = (
    <>
      <div className={styles.statTop}>
        <span className={`${styles.statIcon} ${styles[tone] || ""}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
        {href ? (
          <ArrowUpRight size={18} className={styles.statArrow} strokeWidth={2} />
        ) : null}
      </div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statHint}>{hint}</p>
    </>
  );

  const className = `${styles.statCard} ${card ? styles[card] : ""}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function HomePage() {
  const { user } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const isAdmin = isStaffRole(user?.role);
  const isSuper = isSuperAdminRole(user?.role);
  const pendingBadge = useStaffPendingCount(user, { fetchOnMount: false });
  const firstName = user?.name || (isAdmin ? "Admin" : "there");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    projects: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardSummary();
        if (!alive) return;
        const b = data.brokers || {};
        const p = data.projects || {};
        setStats({
          pending: b.pending ?? 0,
          approved: b.approved ?? 0,
          projects: p.total ?? 0,
        });
        setRecentProjects(data.recentProjects || []);
        publishPendingFromSummary(data);
      } catch {
        /* keep zeros */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  const n = (v) => (loading ? "—" : v);

  return (
    <div className={styles.page}>
      <div
        className={`${styles.welcome} ${
          isLight ? styles.welcomeLight : styles.welcomeDark
        }`}
      >
        <div className={styles.atmosphere} aria-hidden>
          <div className={styles.atmDay}>
            <span className={styles.sunHalo} />
            <span className={styles.sunGlow} />
            <span className={styles.sunCore} />
            <span className={`${styles.cloud} ${styles.cloudA}`} />
            <span className={`${styles.cloud} ${styles.cloudB}`} />
            <span className={`${styles.cloudSoft} ${styles.cloudC}`} />
            <span className={`${styles.bird} ${styles.birdA}`} />
            <span className={`${styles.bird} ${styles.birdB}`} />
            <span className={`${styles.bird} ${styles.birdC}`} />
          </div>
          <div className={styles.atmNight}>
            <span className={`${styles.nightCloud} ${styles.nightCloudA}`} />
            <span className={`${styles.nightCloudSoft} ${styles.nightCloudB}`} />
            <span className={`${styles.star} ${styles.starA}`} />
            <span className={`${styles.star} ${styles.starB}`} />
            <span className={`${styles.star} ${styles.starC}`} />
            <span className={`${styles.starTiny} ${styles.starD}`} />
            <span className={`${styles.starTiny} ${styles.starE}`} />
          </div>
        </div>
        <span className={styles.welcomeAccent} aria-hidden />
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            {greeting()}{" "}
            <span className={styles.wave} aria-hidden>
              👋
            </span>
          </p>
          <h1 className={styles.title}>{firstName}</h1>
        </header>
        <button
          type="button"
          className={`${styles.themeBtn} ${
            isLight ? styles.themeBtnLight : styles.themeBtnDark
          }`}
          onClick={toggleTheme}
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          title={isLight ? "Dark mode" : "Light mode"}
        >
          <span className={styles.themeClip}>
            <span className={`${styles.themeIcon} ${styles.moonIcon}`} aria-hidden>
              <Moon size={20} strokeWidth={1.75} />
            </span>
            <span className={`${styles.themeIcon} ${styles.sunIcon}`} aria-hidden>
              <span className={styles.sunBtnGlow} />
              <Sun size={20} strokeWidth={1.75} />
            </span>
          </span>
        </button>
      </div>

      {isAdmin ? (
        <>
          <p className={styles.sectionLabel}>Overview</p>
          <div className={styles.stats}>
            <StatCard
              href="/projects"
              icon={FolderKanban}
              label="Projects"
              value={n(stats.projects)}
              hint="All projects"
              tone="toneWarn"
              card="cardAmber"
            />
            <StatCard
              href="/brokers/approved"
              icon={UserCheck}
              label="Brokers"
              value={n(stats.approved)}
              hint="Approved"
              tone="toneInfo"
              card="cardBlue"
            />
            <StatCard
              href={isSuper ? "/approvals" : "/brokers/pending"}
              icon={Clock}
              label="Pending"
              value={n(stats.pending)}
              hint="To review"
              tone="toneOk"
              card="cardTeal"
            />
          </div>
        </>
      ) : (
        <MembershipCard
          membershipId={user?.membershipId}
          name={user?.name}
          partnerType={user?.partnerType}
          firmName={user?.firmName}
          validFrom={user?.membershipValidFrom}
          validTill={user?.membershipValidTill}
          phone={user?.phone}
          maharera={user?.maharera}
          status={user?.status}
        />
      )}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Quick actions</h2>
        </div>
        <div className={styles.quickGrid}>
          {isAdmin ? (
            <>
              <Link
                href={isSuper ? "/approvals" : "/brokers/pending"}
                className={`${styles.quickCard} ${
                  pendingBadge > 0 ? styles.quickCardAlert : ""
                }`}
              >
                <span className={styles.quickTop}>
                  <strong>Approvals</strong>
                  {pendingBadge > 0 ? (
                    <span className={styles.quickBadge}>
                      {pendingBadge > 99 ? "99+" : pendingBadge}
                    </span>
                  ) : null}
                </span>
                <span>
                  {pendingBadge > 0
                    ? `${pendingBadge} pending review`
                    : "Approve or reject registrations"}
                </span>
              </Link>
              <Link href="/brokers" className={styles.quickCard}>
                <strong>All brokers</strong>
                <span>Full partner directory</span>
              </Link>
              <Link href="/projects" className={styles.quickCard}>
                <strong>Projects</strong>
                <span>Browse projects</span>
              </Link>
              <Link href="/profile" className={styles.quickCard}>
                <strong>Account</strong>
                <span>Signed-in admin & logout</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/offers" className={styles.quickCard}>
                <strong>Offers</strong>
                <span>Partner schemes & incentives</span>
              </Link>
              <Link href="/projects" className={styles.quickCard}>
                <strong>Browse projects</strong>
                <span>Active inventory & details</span>
              </Link>
              <Link href="/updates" className={styles.quickCard}>
                <strong>Updates</strong>
                <span>Inbox & broadcasts</span>
              </Link>
              <Link href="/profile" className={styles.quickCard}>
                <strong>Your account</strong>
                <span>Membership & contact details</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {isAdmin && recentProjects.length > 0 ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Recent projects</h2>
            <Link href="/projects" className={styles.panelLink}>
              View all
            </Link>
          </div>
          <ul className={styles.recentList}>
            {recentProjects.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/projects/${p.slug || p._id}`}
                  className={styles.recentItem}
                >
                  <span className={styles.recentName}>{p.name}</span>
                  <span className={styles.recentMeta}>
                    {[p.builder, p.location].filter(Boolean).join(" · ") || "—"}
                    {isAdmin && p.active === false ? " · Inactive" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
