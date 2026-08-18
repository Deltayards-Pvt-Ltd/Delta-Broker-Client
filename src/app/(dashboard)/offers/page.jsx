"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isBrokerRole, isStaffRole, isSuperAdminRole } from "@/lib/roles";
import { deleteOffer, fetchOffers } from "@/lib/offerApi";
import { offerBadge } from "@/lib/offerBadge";
import OfferDetailModal from "@/app/component/OfferDetailModal";
import styles from "./offers.module.css";

const SCOPE_TABS = [
  { id: "all", label: "All", scope: undefined },
  { id: "global", label: "Global", scope: "global" },
  { id: "project", label: "Projects", scope: "project" },
];

const STATUS_TABS = [
  { id: "all", label: "All", filter: undefined },
  { id: "live", label: "Live", filter: "live" },
  { id: "expired", label: "Expired", filter: "expired" },
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
  const [statusTab, setStatusTab] = useState("all");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [selected, setSelected] = useState(null);

  const scope = SCOPE_TABS.find((t) => t.id === scopeTab)?.scope;
  const filter = isStaff
    ? STATUS_TABS.find((t) => t.id === statusTab)?.filter
    : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOffers({ page: 1, limit: 50, scope, filter });
      setOffers(data.offers || []);
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
    if (isBroker) return "Check back soon for new partner incentives.";
    if (statusTab === "expired") return "No expired offers in this view.";
    if (statusTab === "inactive") return "No inactive offers.";
    if (statusTab === "live") return "No live offers right now.";
    return "Create a global or project offer for channel partners.";
  }, [isBroker, statusTab]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Offers</h1>
          <p className={styles.sub}>
            {isBroker
              ? "Schemes and incentives from Delta Yards."
              : "Past end date auto-deactivates for partners. Super admin can extend dates and re-activate anytime."}
          </p>
        </div>
        {canCreate ? (
          <Link href="/offers/new" className={styles.btn}>
            <Plus size={16} /> New offer
          </Link>
        ) : null}
      </div>

      {isStaff ? (
        <div className={styles.tabs} role="tablist" aria-label="Offer status">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={statusTab === t.id}
              className={`${styles.tab} ${statusTab === t.id ? styles.tabOn : ""}`}
              onClick={() => setStatusTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.tabs} role="tablist" aria-label="Offer placement">
        {SCOPE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={scopeTab === t.id}
            className={`${styles.tab} ${scopeTab === t.id ? styles.tabOn : ""}`}
            onClick={() => setScopeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}

      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : !offers.length ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No offers here</p>
          <p className={styles.hint}>{emptyCopy}</p>
          {canCreate && statusTab === "all" ? (
            <Link href="/offers/new" className={styles.btn}>
              <Plus size={16} /> New offer
            </Link>
          ) : null}
        </div>
      ) : (
        <div className={styles.list}>
          {offers.map((o) => {
            const badge = offerBadge(o.startsAt, o.endsAt);
            const range = formatRange(o.startsAt, o.endsAt);
            const isExpired = Boolean(o.expired);
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
                  <p>
                    {o.project?.name
                      ? `Project · ${o.project.name}`
                      : "Global offer"}
                    {range ? ` · ${range}` : ""}
                  </p>
                  <div className={styles.badges}>
                    {isStaff ? (
                      <>
                        <span
                          className={`${styles.badge} ${
                            o.active ? styles.badgeOn : styles.badgeOff
                          }`}
                        >
                          {o.active ? "Active" : "Inactive"}
                        </span>
                        {isExpired ? (
                          <span className={`${styles.badge} ${styles.badgeExpire}`}>
                            Expired
                          </span>
                        ) : null}
                        {o.live ? (
                          <span className={`${styles.badge} ${styles.badgeOn}`}>
                            Live
                          </span>
                        ) : null}
                      </>
                    ) : null}
                    {badge ? (
                      <span
                        className={`${styles.badge} ${
                          badge.kind === "start"
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
