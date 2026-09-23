"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Users,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import {
  disableBroker,
  enableBroker,
  fetchBroker,
  fetchBrokerLeadCount,
} from "@/lib/brokerApi";
import BrokerEditModal from "@/app/component/BrokerEditModal";
import styles from "../brokers.module.css";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return `+91 ${phone}`;
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function canToggleAccess(status) {
  return status === "approved" || status === "active" || status === "inactive";
}

function isEnabledStatus(status) {
  return status === "approved" || status === "active";
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "approved" || s === "active") return styles.statusApproved;
  if (s === "pending") return styles.statusPending;
  if (s === "rejected") return styles.statusRejected;
  return styles.statusInactive;
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (!s) return "—";
  if (s === "inactive") return "DISABLED";
  return s.toUpperCase();
}

function categoryNames(broker) {
  return (broker?.categories || [])
    .map((c) => (typeof c === "object" && c?.name ? c.name : null))
    .filter(Boolean);
}

function InfoRow({ icon: Icon, label, value, href }) {
  const inner = (
    <>
      <span className={styles.infoIcon}>
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className={styles.infoCol}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value || "—"}</span>
      </span>
      {href ? (
        <ExternalLink size={14} strokeWidth={1.75} className={styles.infoAction} />
      ) : null}
    </>
  );

  if (href) {
    const Tag = href.startsWith("/") ? Link : "a";
    return (
      <Tag className={styles.infoRow} href={href}>
        {inner}
      </Tag>
    );
  }

  return <div className={styles.infoRow}>{inner}</div>;
}

function VerifyBadge({ label, verified }) {
  return (
    <span className={`${styles.verify} ${verified ? styles.verifyOk : styles.verifyNo}`}>
      {verified ? (
        <CheckCircle2 size={13} strokeWidth={2} />
      ) : (
        <XCircle size={13} strokeWidth={2} />
      )}
      {label} {verified ? "verified" : "not verified"}
    </span>
  );
}

export default function BrokerDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = isSuperAdminRole(user?.role);
  const [broker, setBroker] = useState(null);
  const [leadsCount, setLeadsCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchBroker(id);
      setBroker(data.broker || null);
    } catch (err) {
      setError(err.message || "Failed to load broker");
      setBroker(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLeadsCount(null);
    fetchBrokerLeadCount(id)
      .then((d) => {
        if (alive) setLeadsCount(d.leadsCount ?? 0);
      })
      .catch(() => {
        if (alive) setLeadsCount(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const onToggleAccess = async () => {
    if (!broker || !canToggleAccess(broker.status) || toggling) return;
    const enabling = broker.status === "inactive";
    const ok = window.confirm(
      enabling
        ? `Enable ${broker.name || "this broker"}? They will be able to log in and receive notifications again.`
        : `Disable ${broker.name || "this broker"}? They will not be able to log in or receive notifications.`
    );
    if (!ok) return;

    setToggling(true);
    setError("");
    try {
      const data = enabling
        ? await enableBroker(broker._id)
        : await disableBroker(broker._id);
      if (data.broker) setBroker((prev) => ({ ...prev, ...data.broker }));
    } catch (err) {
      setError(err.message || "Failed to update broker access");
    } finally {
      setToggling(false);
    }
  };

  const isCompany =
    String(broker?.partnerType || "").toLowerCase() === "company";
  const title = isCompany
    ? broker?.firmName || broker?.name || "—"
    : broker?.name || "—";
  const cats = categoryNames(broker);
  const telHref = broker?.phone
    ? `tel:${String(broker.phone).replace(/\s/g, "")}`
    : null;
  const mailHref = broker?.email ? `mailto:${broker.email}` : null;

  return (
    <div className={styles.detailPage}>
      <Link href="/brokers" className={styles.back}>
        <ChevronLeft size={18} strokeWidth={2} />
        Brokers
      </Link>

      {loading ? <p className={styles.muted}>Loading…</p> : null}

      {error && !broker ? (
        <div className={styles.empty}>
          <p className={styles.error}>{error}</p>
          <button type="button" className={styles.retry} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !broker && !error ? (
        <div className={styles.empty}>Broker not found. Go back and try again.</div>
      ) : null}

      {broker ? (
        <>
          {error ? <p className={styles.error}>{error}</p> : null}

          <section className={styles.hero}>
            <div className={styles.heroAvatar}>
              {isCompany ? (
                <Building2 size={30} strokeWidth={1.6} />
              ) : (
                initials(broker.name)
              )}
            </div>
            <h1 className={styles.heroName}>{title}</h1>
            {isCompany && broker.name ? (
              <p className={styles.heroSub}>{broker.name}</p>
            ) : null}
            <p className={styles.heroMembershipId}>
              {broker.membershipId || "No membership id"}
            </p>

            <div className={styles.heroChips}>
              <span className={`${styles.statusChip} ${statusClass(broker.status)}`}>
                {statusLabel(broker.status)}
              </span>
              <span
                className={`${styles.typePill} ${
                  isCompany ? styles.typeCompany : styles.typeIndividual
                }`}
              >
                {isCompany ? (
                  <Building2 size={12} strokeWidth={2} />
                ) : (
                  <User size={12} strokeWidth={2} />
                )}
                {isCompany ? "Company" : "Individual"}
              </span>
            </div>

            {canEdit ? (
              <div className={styles.heroActions}>
                {canToggleAccess(broker.status) ? (
                  <button
                    type="button"
                    className={`${styles.switch} ${
                      isEnabledStatus(broker.status) ? styles.switchOn : ""
                    }`}
                    onClick={onToggleAccess}
                    disabled={toggling}
                    aria-pressed={isEnabledStatus(broker.status)}
                    aria-label={
                      isEnabledStatus(broker.status)
                        ? `Disable ${broker.name || "broker"}`
                        : `Enable ${broker.name || "broker"}`
                    }
                    title={
                      isEnabledStatus(broker.status)
                        ? "Disable — no login, no notifications"
                        : "Enable — restore login and notifications"
                    }
                  >
                    <span className={styles.switchKnob} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={14} strokeWidth={1.75} />
                  Edit
                </button>
              </div>
            ) : null}
          </section>

          <h2 className={styles.sectionTitle}>Contact</h2>
          <section className={styles.panel}>
            <InfoRow
              icon={Phone}
              label="Phone"
              value={formatPhone(broker.phone)}
              href={telHref}
            />
            <div className={styles.divider} />
            <InfoRow
              icon={Mail}
              label="Email"
              value={broker.email}
              href={mailHref}
            />
            <div className={styles.badgesRow}>
              <VerifyBadge label="Phone" verified={!!broker.phoneVerified} />
              <VerifyBadge label="Email" verified={!!broker.emailVerified} />
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Business</h2>
          <section className={styles.panel}>
            {isCompany ? (
              <>
                <InfoRow icon={Building2} label="Firm name" value={broker.firmName} />
                <div className={styles.divider} />
                <InfoRow icon={User} label="Contact person" value={broker.name} />
                <div className={styles.divider} />
              </>
            ) : null}
            <InfoRow icon={Award} label="MahaRERA" value={broker.maharera} />
            {cats.length ? (
              <>
                <div className={styles.divider} />
                <div className={styles.catBlock}>
                  <span className={styles.infoLabel}>Categories</span>
                  <div className={styles.catRow}>
                    {cats.map((name) => (
                      <span key={name} className={styles.catChip}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <h2 className={styles.sectionTitle}>Membership</h2>
          <section className={styles.panel}>
            <InfoRow
              icon={Users}
              label="Visits"
              value={leadsCount == null ? "…" : String(leadsCount)}
              href={`/brokers/${broker._id}/leads`}
            />
            <div className={styles.divider} />
            <InfoRow
              icon={CreditCard}
              label="Membership id"
              value={broker.membershipId}
            />
            <div className={styles.divider} />
            <InfoRow
              icon={Calendar}
              label="Valid from"
              value={formatDate(broker.membershipValidFrom)}
            />
            <div className={styles.divider} />
            <InfoRow
              icon={Calendar}
              label="Valid till"
              value={formatDate(broker.membershipValidTill)}
            />
            <div className={styles.divider} />
            <InfoRow
              icon={Clock}
              label="Registered on"
              value={formatDate(broker.createdAt)}
            />
          </section>

          {canEdit ? (
            <BrokerEditModal
              broker={broker}
              open={editing}
              onClose={() => setEditing(false)}
              onSaved={(updated) => {
                if (updated) setBroker((prev) => ({ ...prev, ...updated }));
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
