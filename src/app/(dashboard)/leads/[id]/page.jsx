"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Banknote,
  Building2,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleCheck,
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
import { fetchLeadById } from "@/lib/leadApi";
import {
  extraFieldIcon,
  formatLeadDate,
  formatOnDate,
  leadActivities,
  leadExtraFields,
  leadName,
  leadPhone,
  leadProject,
  leadStatus,
  statusBadgeColors,
} from "@/lib/leadDisplay";
import styles from "../leads.module.css";

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

function ActivityIcon({ kind }) {
  const props = { size: 14, strokeWidth: 2 };
  if (kind === "visit") return <MapPin {...props} />;
  if (kind === "followup") return <CalendarClock {...props} />;
  if (kind === "booking") return <CircleCheck {...props} />;
  return <Flag {...props} />;
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
        const tone = item.statusName ? statusBadgeColors(item.statusName) : null;
        return (
          <div key={item.id} className={styles.activityRow}>
            <div className={styles.activityRail}>
              <span className={styles.activityNode}>
                <ActivityIcon kind={item.kind} />
              </span>
              {!last ? <span className={styles.activityLine} /> : null}
            </div>
            <div className={styles.activityBody}>
              <p className={styles.activityWhen}>
                {formatOnDate(item.at) || "Date unavailable"}
              </p>
              {item.statusName ? (
                <span
                  className={styles.statusChip}
                  style={{ background: tone?.bg, color: tone?.text }}
                >
                  {item.statusName}
                </span>
              ) : null}
              {item.sentence ? (
                <p className={styles.activityMeta}>{item.sentence}</p>
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

export default function LeadDetailsPage() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchLeadById(id);
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
  }, [id]);

  const name = leadName(lead);
  const phone = leadPhone(lead);
  const project = leadProject(lead);
  const status = leadStatus(lead);
  const extras = leadExtraFields(lead);
  const activities = useMemo(() => leadActivities(lead), [lead]);
  const created = formatLeadDate(lead?.createdAt);
  const badge = statusBadgeColors(lead?.currentStatus || status);

  return (
    <div className={styles.page}>
      <Link href="/leads" className={styles.back}>
        <ChevronLeft size={18} strokeWidth={2} />
        Leads
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
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={styles.heroPhone}>
                <span className={styles.callWell}>
                  <Phone size={14} strokeWidth={2} />
                </span>
                {phone}
              </a>
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
                style={{ background: badge.bg, color: badge.text }}
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
