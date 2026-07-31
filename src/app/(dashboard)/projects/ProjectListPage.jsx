"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  deleteProject,
  fetchProjects,
  fetchProjectMeta,
} from "@/lib/projectApi";
import Pagination from "@/app/component/Pagination";
import styles from "./projects.module.css";

function coverSrc(p) {
  return p.coverImage || p.bannerImage || p.logo || "";
}

function startingPrice(p) {
  const prices = (p.layouts || [])
    .map((l) => l.price)
    .filter((v) => v != null && String(v).trim() !== "");
  if (!prices.length) return null;
  return String(prices[0]);
}

/**
 * @param {"all"|"active"|"inactive"} [filter]
 */
export default function ProjectListPage({
  title,
  filter = "all",
  eyebrow = "Projects",
  emptyText = "No projects found.",
}) {
  const { user } = useAuth();
  const isBroker = user?.role === "broker";
  const isAdmin = user?.role === "admin";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [visibility, setVisibility] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, location, visibility, filter, limit, isBroker]);

  // Load location options for the filter dropdown (once)
  useEffect(() => {
    fetchProjectMeta()
      .then((data) => setLocations(data.locations || []))
      .catch(() => setLocations([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fixed pages (/projects/active, /projects/closed) keep their filter.
      // On the main page, admin can pick active/inactive from the dropdown.
      let apiFilter;
      if (!isBroker) {
        if (filter !== "all") apiFilter = filter;
        else if (visibility !== "all") apiFilter = visibility;
      }
      const data = await fetchProjects({
        page,
        limit,
        filter: apiFilter,
        q: debouncedQ || undefined,
        location: location || undefined,
      });
      setProjects(data.projects || []);
      setTotal(data.count ?? data.projects?.length ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load");
      setProjects([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, visibility, debouncedQ, location, isBroker]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id, name) => {
    if (
      !confirm(
        `Delete “${name || "this project"}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError("");
    try {
      await deleteProject(id);
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const pageTitle =
    title || (isBroker ? "Active Projects" : "All Projects");
  const pageCopy = isBroker
    ? "Active projects available for you."
    : filter === "active"
      ? "Projects marked active."
      : filter === "inactive"
        ? "Inactive / closed projects."
        : "All projects in your inventory.";

  return (
    <div className={styles.page}>
      <header className={styles.listHeaderRow}>
        <div className={styles.listHeader}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.copy}>{pageCopy}</p>
        </div>
        {isAdmin ? (
          <Link href="/projects/new" className={styles.addBtn}>
            <Plus size={16} strokeWidth={2} />
            Add project
          </Link>
        ) : null}
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search project name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className={styles.filterSelect}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {isAdmin && filter === "all" ? (
          <select
            className={styles.filterSelect}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="all">All projects</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Loading…</p> : null}

      {!loading && !error && total === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : null}

      {!loading && projects.length > 0 ? (
        <>
          <div className={styles.grid}>
            {projects.map((p) => {
              const href = `/projects/${p.slug || p._id}`;
              const img = coverSrc(p);
              const active = p.active !== false;
              const price = startingPrice(p);
              return (
                <article key={p._id} className={styles.card}>
                  <div className={styles.media}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.name || "Project"} />
                    ) : (
                      <div className={styles.coverPlaceholder}>No image</div>
                    )}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.cardTop}>
                      <h2 className={styles.name}>{p.name}</h2>
                      {!isBroker ? (
                        <span
                          className={`${styles.badge} ${
                            active ? styles.badgeActive : styles.badgeInactive
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      ) : null}
                    </div>

                    {p.location ? (
                      <p className={styles.location}>
                        <MapPin size={14} strokeWidth={1.75} />
                        {p.location}
                      </p>
                    ) : null}

                    {p.builder ? (
                      <p className={styles.builder}>{p.builder}</p>
                    ) : null}

                    <div className={styles.row}>
                      {p.propertyType ? (
                        <span className={styles.badge}>{p.propertyType}</span>
                      ) : null}
                      {p.status ? (
                        <span
                          className={`${styles.badge} ${styles.badgeStatus}`}
                        >
                          {p.status}
                        </span>
                      ) : null}
                    </div>

                    {price ? (
                      <p className={styles.price}>
                        Starting <strong>{price}</strong>
                      </p>
                    ) : null}

                    <div className={styles.cardActions}>
                      <Link href={href} className={styles.cta}>
                        View Details
                        <ArrowRight size={16} strokeWidth={1.75} />
                      </Link>
                      {isAdmin ? (
                        <div className={styles.adminActions}>
                          <Link
                            href={`/projects/${p._id}/edit`}
                            className={styles.editLink}
                          >
                            <Pencil size={14} strokeWidth={2} />
                            Edit
                          </Link>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            disabled={deletingId === p._id}
                            onClick={() => onDelete(p._id, p.name)}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            {deletingId === p._id ? "…" : "Delete"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
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
          />
        </>
      ) : null}
    </div>
  );
}
