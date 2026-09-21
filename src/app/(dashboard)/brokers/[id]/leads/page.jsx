"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  Phone,
  Search,
  Users,
} from "lucide-react";
import Pagination from "@/app/component/Pagination";
import {
  fetchBroker,
  fetchBrokerLeads,
  fetchBrokerLeadsMeta,
} from "@/lib/brokerApi";
import {
  formatLeadDate,
  leadName,
  leadPhone,
  leadProject,
  leadStatus,
  statusBadgeColors,
} from "@/lib/leadDisplay";
import styles from "../../../leads/leads.module.css";

const PAGE_SIZE = 20;

function partnerLabel(broker) {
  if (!broker) return "";
  const isCompany = String(broker.partnerType || "").toLowerCase() === "company";
  return isCompany
    ? broker.firmName || broker.name || ""
    : broker.name || "";
}

export default function BrokerLeadsPage() {
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPartner(null);
    setQuery("");
    setDebouncedQ("");
    setProjectFilter("");
    setStatusFilter("");
    setPage(1);
    setLeads([]);
    setError("");
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, projectFilter, statusFilter, limit]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchBroker(id)
      .then((data) => {
        if (alive) setPartner(data.broker || null);
      })
      .catch(() => {
        if (alive) setPartner(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchBrokerLeadsMeta(id)
      .then((data) => {
        setProjects(data.projects || []);
        setStatuses(data.statuses || []);
        if (data.broker) setPartner((prev) => prev || data.broker);
      })
      .catch(() => {
        setProjects([]);
        setStatuses([]);
      });
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchBrokerLeads(id, {
        page,
        limit,
        q: debouncedQ || undefined,
        projectId: projectFilter || undefined,
        statusId: statusFilter || undefined,
      });
      setLeads(data.leads || []);
      setTotal(data.count ?? data.pagination?.totalItems ?? 0);
      setTotalPages(data.totalPages ?? data.pagination?.totalPages ?? 1);
      if (data.broker) setPartner((prev) => prev || data.broker);
    } catch (err) {
      setError(err.message || "Failed to load leads");
      setLeads([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [id, page, limit, debouncedQ, projectFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const emptyText =
    debouncedQ || projectFilter || statusFilter
      ? "No leads found. Try a different search or clear the filters."
      : "No leads yet.";

  const label = partnerLabel(partner);
  const membershipId = partner?.membershipId || "";

  return (
    <div className={styles.page}>
      <Link href={`/brokers/${id}`} className={styles.back}>
        <ChevronLeft size={18} strokeWidth={2} />
        Partner
      </Link>

      <header className={styles.listHeaderRow}>
        <div className={styles.listHeader}>
          <p className={styles.eyebrow}>{label || "Partner"}</p>
          <h1 className={styles.title}>Leads</h1>
          <p className={styles.copy}>
            {membershipId || "Clients this partner referred to Delta Yards"}
          </p>
        </div>
        <div className={styles.countPill} title="Matching leads">
          {loading ? "—" : total}
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search name or mobile…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className={styles.filterSelect}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Loading…</p> : null}

      {!loading && !error && total === 0 ? (
        <div className={styles.empty}>
          <Users size={28} strokeWidth={1.5} />
          {emptyText}
        </div>
      ) : null}

      {!loading && leads.length > 0 ? (
        <>
          <div className={styles.grid}>
            {leads.map((lead) => {
              const name = leadName(lead);
              const phone = leadPhone(lead);
              const project = leadProject(lead);
              const status = leadStatus(lead);
              const tone = statusBadgeColors(lead.currentStatus || status);
              return (
                <Link
                  key={lead._id}
                  href={`/brokers/${id}/leads/${lead._id}`}
                  className={styles.card}
                >
                  <span
                    className={styles.statusRail}
                    style={{ background: tone.bg }}
                    aria-hidden
                  />
                  <div className={styles.body}>
                    <div className={styles.cardHead}>
                      <div className={styles.avatar} aria-hidden>
                        {initials(name)}
                      </div>
                      <div className={styles.identity}>
                        <h2 className={styles.name}>{name}</h2>
                        {phone ? (
                          <span className={styles.phoneBtn}>
                            <span className={styles.callWell}>
                              <Phone size={13} strokeWidth={2.2} />
                            </span>
                            {phone}
                          </span>
                        ) : (
                          <p className={styles.noPhone}>No mobile on file</p>
                        )}
                      </div>
                      {status ? (
                        <span
                          className={styles.statusBadge}
                          style={{ background: tone.bg, color: tone.text }}
                        >
                          {status}
                        </span>
                      ) : null}
                    </div>

                    <div className={styles.meta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>
                          <Building2 size={15} strokeWidth={1.75} />
                        </span>
                        <div className={styles.metaText}>
                          <span className={styles.metaLabel}>Project</span>
                          <span className={styles.metaValue}>
                            {project || "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>
                          <Calendar size={15} strokeWidth={1.75} />
                        </span>
                        <div className={styles.metaText}>
                          <span className={styles.metaLabel}>Created</span>
                          <span className={styles.metaValue}>
                            {formatLeadDate(lead.createdAt || lead.updatedAt) ||
                              "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.foot}>
                      <span>View details</span>
                      <ArrowRight size={16} strokeWidth={1.75} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            disabled={loading}
            onPageChange={setPage}
            onLimitChange={setLimit}
            limitOptions={[20, 40, 60]}
          />
        </>
      ) : null}
    </div>
  );
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
