"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Banknote,
  Building2,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Flag,
  GitBranch,
  Landmark,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { fetchBrokerLead } from "@/lib/brokerApi";
import {
  extraFieldIcon,
  FALLBACK_STATUS_COLOR,
  formatLeadDate,
  formatLeadDateTime,
  formatOnDate,
  leadExtraFields,
  leadName,
  leadPhone,
  leadProject,
  leadStatus,
  statusColor,
} from "@/lib/leadDisplay";
import styles from "../../../../leads/leads.module.css";

const PREVIEW_COUNT = 5;

const EXTRA_ICONS = {
  gender: Users,
  verified: ShieldCheck,
  budget: Banknote,
  property: Building2,
  config: LayoutGrid,
  priority: Zap,
  fund: Landmark,
  source: GitBranch,
  note: MessageSquare,
  location: MapPin,
  tag: Tag,
};

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ExtraIcon({ name }) {
  const Icon = EXTRA_ICONS[name] || Tag;
  return <Icon size={18} strokeWidth={1.75} />;
}

function ActivityList({ items }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = Math.max(0, items.length - PREVIEW_COUNT);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div className={styles.activityCard}>
      {visible.map((item, i) => {
        const last = i === visible.length - 1 && !(hidden && !expanded);
        const color = item.color || FALLBACK_STATUS_COLOR;
        return (
          <div key={`${item.updatedAt}-${i}`} className={styles.activityRow}>
            <div className={styles.activityRail}>
              <span className={styles.activityNode}>
                <Flag size={14} strokeWidth={2} />
              </span>
              {!last ? <span className={styles.activityLine} /> : null}
            </div>
            <div className={styles.activityBody}>
              <p className={styles.activityWhen}>
                {formatOnDate(item.updatedAt) || "Date unavailable"}
              </p>
              {item.name ? (
                <span
                  className={styles.statusChip}
                  style={{ background: color, color: "#fff" }}
                >
                  {item.name}
                </span>
              ) : null}
              {item.nextDate ? (
                <p className={styles.activityMeta}>
                  Next date: {formatLeadDateTime(item.nextDate)}
                </p>
              ) : null}
              {item.remark ? (
                <p className={styles.activityNote}>
                  <span className={styles.activityNoteLabel}>Remark</span>
                  {item.remark}
                </p>
              ) : null}
              {item.optionalRemark ? (
                <p className={styles.activityNote}>
                  <span className={styles.activityNoteLabel}>Optional remark</span>
                  {item.optionalRemark}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
      {hidden > 0 ? (
        <button
          type="button"
          className={styles.seeMore}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Show less" : `See more (${hidden})`}
        </button>
      ) : null}
    </div>
  );
}

export default function BrokerLeadDetailsPage() {
  const { id, leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !leadId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchBrokerLead(id, leadId);
        if (alive) setLead(data.lead || null);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load lead");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, leadId]);

  const name = leadName(lead);
  const phone = leadPhone(lead);
  const project = leadProject(lead);
  const status = leadStatus(lead);
  const extras = leadExtraFields(lead);
  const activities = lead?.statusChanges || [];
  const created = formatLeadDate(lead?.createdAt);
  const badgeColor = statusColor(lead?.currentStatus);

  return (
    <div className={styles.page}>
      <Link href={`/brokers/${id}/leads`} className={styles.back}>
        <ChevronLeft size={18} strokeWidth={2} />
        Visits
      </Link>

      {loading ? <p className={styles.muted}>Loading…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !lead && !error ? (
        <div className={styles.empty}>Lead not found. Go back and try again.</div>
      ) : null}

      {lead ? (
        <>
          <section className={styles.hero}>
            <div className={styles.heroAvatar}>{initials(name)}</div>
            <h1 className={styles.heroName}>{name}</h1>
            {phone ? (
              <span className={styles.heroPhone}>
                <span className={styles.callWell}>
                  <Phone size={14} strokeWidth={2} />
                </span>
                {phone}
              </span>
            ) : null}

            {project || created ? (
              <div className={styles.heroLine}>
                {project ? (
                  <span className={styles.heroLineItem}>
                    <Building2 size={16} strokeWidth={1.75} />
                    {project}
                  </span>
                ) : null}
                {project && created ? <span className={styles.heroDot} /> : null}
                {created ? (
                  <span className={styles.heroLineItem}>
                    <CalendarPlus size={16} strokeWidth={1.75} />
                    {created}
                  </span>
                ) : null}
              </div>
            ) : null}

            {status ? (
              <span
                className={styles.statusPill}
                style={{ background: badgeColor, color: "#fff" }}
              >
                {status.toUpperCase()}
              </span>
            ) : null}
          </section>

          {activities.length ? (
            <>
              <h2 className={styles.sectionTitle}>Activity</h2>
              <ActivityList items={activities} />
            </>
          ) : null}

          {extras.length ? (
            <>
              <h2 className={styles.sectionTitle}>Details</h2>
              <div className={styles.moreGrid}>
                {extras.map((row, i) => (
                  <div key={`${row.label}-${i}`} className={styles.moreTile}>
                    <div className={styles.moreTileHead}>
                      <ExtraIcon name={extraFieldIcon(row.label)} />
                      <span className={styles.moreLabel}>{row.label}</span>
                    </div>
                    <p className={styles.moreValue}>{row.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
