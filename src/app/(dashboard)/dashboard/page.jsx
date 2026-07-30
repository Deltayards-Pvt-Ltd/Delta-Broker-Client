"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  FolderKanban,
  UserCheck,
  UserX,
  Users,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import MembershipCard from "@/app/component/MembershipCard";
import { fetchDashboardSummary } from "@/lib/dashboardApi";
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
  const isAdmin = user?.role === "admin";
  const firstName =
    user?.name?.split(" ")[0] || (isAdmin ? "Admin" : "there");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalBrokers: 0,
    projects: 0,
    activeProjects: 0,
    inactiveProjects: 0,
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
          rejected: b.rejected ?? 0,
          totalBrokers: b.total ?? 0,
          projects: p.total ?? 0,
          activeProjects: p.active ?? 0,
          inactiveProjects: p.inactive ?? 0,
        });
        setRecentProjects(data.recentProjects || []);
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
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {isAdmin ? "Admin dashboard" : "Channel partner"}
          </p>
          <h1 className={styles.title}>
            {greeting()}, {firstName}
          </h1>
          <p className={styles.copy}>
            {isAdmin
              ? "Channel partner network overview for Delta Yards."
              : "Membership minted — browse projects from here."}
          </p>
        </div>
      </header>

      {isAdmin ? (
        <div className={styles.stats}>
          <StatCard
            href="/approvals"
            icon={Clock}
            label="Pending approvals"
            value={n(stats.pending)}
            hint="Awaiting review"
            tone="toneWarn"
            card="cardAmber"
          />
          <StatCard
            href="/brokers/approved"
            icon={UserCheck}
            label="Approved brokers"
            value={n(stats.approved)}
            hint="Can sign in"
            tone="toneOk"
            card="cardEmerald"
          />
          <StatCard
            href="/brokers/rejected"
            icon={UserX}
            label="Rejected"
            value={n(stats.rejected)}
            hint="Not approved"
            tone="toneDanger"
            card="cardRed"
          />
          <StatCard
            href="/brokers"
            icon={Users}
            label="Total brokers"
            value={n(stats.totalBrokers)}
            hint="All statuses"
            tone="toneInfo"
            card="cardBlue"
          />
          <StatCard
            href="/projects"
            icon={FolderKanban}
            label="All projects"
            value={n(stats.projects)}
            hint="Inventory"
            tone="tonePrimary"
            card="cardTeal"
          />
          <StatCard
            href="/projects/active"
            icon={BadgeCheck}
            label="Active projects"
            value={n(stats.activeProjects)}
            hint="Visible to brokers"
            tone="toneOk"
            card="cardEmerald"
          />
          <StatCard
            href="/projects/closed"
            icon={Building2}
            label="Inactive projects"
            value={n(stats.inactiveProjects)}
            hint="Hidden from brokers"
            tone="toneMuted"
            card="cardSlate"
          />
        </div>
      ) : (
        <>
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

        </>
      )}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Quick actions</h2>
        </div>
        <div className={styles.quickGrid}>
          {isAdmin ? (
            <>
              <Link href="/approvals" className={styles.quickCard}>
                <strong>Approvals</strong>
                <span>Approve or reject registrations</span>
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
              <Link href="/projects" className={styles.quickCard}>
                <strong>Browse projects</strong>
                <span>Active inventory & details</span>
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
