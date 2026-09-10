"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isBrokerRole, isStaffRole, isSuperAdminRole } from "@/lib/roles";
import { deleteOffer, fetchOffers } from "@/lib/offerApi";
import { offerBadge } from "@/lib/offerBadge";
import { offerChipLabel } from "@/lib/offerCoverage";
import OfferDetailModal from "@/app/component/OfferDetailModal";
import styles from "./offers.module.css";

const SCOPES = [
  { id: "all", label: "All", scope: undefined },
  { id: "global", label: "Global", scope: "global" },
  { id: "project", label: "Projects", scope: "project" },
];

const SECTIONS = [
  { id: "live", label: "Active", filter: "live" },
  { id: "expired", label: "Expired", filter: "expired" },
];

const STAFF_SECTIONS = [
  ...SECTIONS,
  { id: "inactive", label: "Inactive", filter: "inactive" },
];

function formatRange(startsAt, endsAt) {
  const fmt = (d) => {
    if (!d) return null;
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    return x.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  const a = fmt(startsAt);
  const b = fmt(endsAt);
  if (a && b) return `${a} – ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return null;
}

export default function OffersPage() {
  const { user } = useAuth();
  const canCreate = isSuperAdminRole(user?.role);
  const canDelete = isSuperAdminRole(user?.role);
  const canEdit = isSuperAdminRole(user?.role);
  const isStaff = isStaffRole(user?.role);
  const isBroker = isBrokerRole(user?.role);

  const [scopeTab, setScopeTab] = useState("all");
  const [statusTab, setStatusTab] = useState("live");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [selected, setSelected] = useState(null);
  const [buckets, setBuckets] = useState({
    active: 0,
    expired: 0,
    inactive: 0,
  });
  const scopeRef = useRef(null);

  const sections = isStaff ? STAFF_SECTIONS : SECTIONS;
  const scopeMeta = SCOPES.find((t) => t.id === scopeTab) || SCOPES[0];
  const sectionMeta = sections.find((t) => t.id === statusTab) || SECTIONS[0];
  const scope = isStaff ? scopeMeta.scope : undefined;
  const filter = isStaff ? sectionMeta.filter : "live";
  const hasAnyOffers =
    buckets.active +
      (isStaff ? buckets.expired + (buckets.inactive || 0) : 0) >
    0;
  const showFilters = isStaff && hasAnyOffers;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOffers({ page: 1, limit: 50, scope, filter });
      setOffers(data.offers || []);
      if (data.buckets) setBuckets(data.buckets);
    } catch (err) {
      setError(err.message || "Failed to load offers");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [scope, filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!scopeOpen) return;
    const onDoc = (e) => {
      if (!scopeRef.current?.contains(e.target)) setScopeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [scopeOpen]);

  const onDelete = async (id) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this offer?")) return;
    setOk("");
    setError("");
    try {
      await deleteOffer(id);
      setOk("Offer deleted");
      setSelected(null);
      load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const emptyCopy = useMemo(() => {
    if (isBroker) return "Check back soon for partner incentives.";
    if (!hasAnyOffers) {
      return "Create a global or project offer for channel partners.";
    }
    const scopeLabel =
      scopeTab === "all" ? "" : `${scopeMeta.label.toLowerCase()} `;
    if (statusTab === "expired") return `No expired ${scopeLabel}offers.`;
    if (statusTab === "inactive") return "No paused offers. Inactive is hidden from partners.";
    return `No ${scopeLabel}offers right now.`;
  }, [hasAnyOffers, isBroker, statusTab, scopeTab, scopeMeta.label]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Offers</h1>
          <p className={styles.sub}>
            {isBroker
              ? "Schemes and incentives from Delta Yards."
              : "Active is live for partners. Inactive is admin-only. Expired is past the end date."}
          </p>
        </div>
        {canCreate ? (
          <Link href="/offers/new" className={styles.btn}>
            <Plus size={16} /> New offer
          </Link>
        ) : null}
      </div>

      {!loading && showFilters ? (
      <div className={styles.filterRow}>
        <div className={styles.segment} role="tablist" aria-label="Offer status">
          {sections.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={statusTab === t.id}
              className={`${styles.segmentBtn} ${
                statusTab === t.id ? styles.segmentOn : ""
              }`}
              onClick={() => setStatusTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.scopeWrap} ref={scopeRef}>
          <button
            type="button"
            className={styles.scopeDrop}
            aria-haspopup="listbox"
            aria-expanded={scopeOpen}
            onClick={() => setScopeOpen((v) => !v)}
          >
            {scopeMeta.label}
            <ChevronDown size={14} />
          </button>
          {scopeOpen ? (
            <ul className={styles.scopeMenu} role="listbox">
              {SCOPES.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={scopeTab === s.id}
                    className={`${styles.scopeItem} ${
                      scopeTab === s.id ? styles.scopeItemOn : ""
                    }`}
                    onClick={() => {
                      setScopeTab(s.id);
                      setScopeOpen(false);
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}

      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : !offers.length ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {hasAnyOffers ? "No offers here" : "No offers yet"}
          </p>
          <p className={styles.hint}>{emptyCopy}</p>
          {canCreate && (!hasAnyOffers || statusTab === "live") ? (
            <Link href="/offers/new" className={styles.btn}>
              <Plus size={16} /> New offer
            </Link>
          ) : null}
        </div>
      ) : (
        <div className={styles.list}>
          {offers.map((o) => {
            const badge = offerBadge(o.startsAt, o.endsAt, o);
            const range = formatRange(o.startsAt, o.endsAt);
            const chip = offerChipLabel(o);
            return (
              <button
                key={o._id}
                type="button"
                className={`${styles.card} ${styles.cardBtn}`}
                onClick={() => setSelected(o)}
              >
                {o.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.bannerImage} alt="" className={styles.thumb} />
                ) : (
                  <div className={`${styles.thumb} ${styles.thumbEmpty}`}>
                    <Gift size={22} strokeWidth={1.75} />
                  </div>
                )}
                <div className={styles.meta}>
                  <h3>{o.title}</h3>
                  <p>{range || "No end date"}</p>
                  <div className={styles.badges}>
                    <span className={`${styles.badge} ${styles.badgeStart}`}>
                      {chip}
                    </span>
                    {statusTab === "inactive" ? (
                      <span className={`${styles.badge} ${styles.badgeOff}`}>
                        Inactive
                      </span>
                    ) : null}
                    {badge ? (
                      <span
                        className={`${styles.badge} ${
                          badge.kind === "expired"
                            ? styles.badgeExpired
                            : badge.kind === "start"
                              ? styles.badgeStart
                              : styles.badgeExpire
                        }`}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                {canEdit || canDelete ? (
                  <div className={styles.actions}>
                    {canEdit ? (
                      <Link
                        href={`/offers/${o._id}/edit`}
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil size={14} /> Edit
                      </Link>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(o._id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <OfferDetailModal
        open={Boolean(selected)}
        offer={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
