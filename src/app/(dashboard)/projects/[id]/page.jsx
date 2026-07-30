"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchProject } from "@/lib/projectApi";
import {
  downloadBrochure,
  downloadGalleryZip,
  downloadLayoutImage,
} from "@/lib/downloadAsset";
import styles from "../projects.module.css";

function layoutImage(layout) {
  return layout?.image || layout?.images?.[0] || "";
}

function configsLabel(project) {
  const plans = (project.plans || []).filter(Boolean);
  if (plans.length) return plans.join(" – ");
  const fromLayouts = (project.layouts || [])
    .map((l) => l.title)
    .filter(Boolean);
  return fromLayouts.length ? fromLayouts.join(" – ") : "";
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isBroker = user?.role === "broker";
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [busy, setBusy] = useState("");
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllGallery, setShowAllGallery] = useState(false);

  const FEATURE_LIMIT = 6;
  const GALLERY_LIMIT = 6;

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchProject(id);
        if (alive) {
          setProject(data.project);
          setLayoutIndex(0);
        }
      } catch (err) {
        if (alive) setError(err.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const detailRows = useMemo(() => {
    if (!project) return [];
    const rows = [
      { label: "Developer", value: project.builder },
      { label: "Location", value: project.location },
      { label: "Contact number", value: project.contactNumber },
      { label: "RERA number", value: project.reraNo },
      { label: "Project status", value: project.status },
      { label: "Project type", value: project.propertyType },
      { label: "Configurations", value: configsLabel(project) },
    ];
    if (!isBroker) {
      rows.push({
        label: "Visibility",
        value: project.active !== false ? "Active" : "Inactive",
      });
    }
    return rows.filter((r) => r.value);
  }, [project, isBroker]);

  const layouts = project?.layouts || [];
  const activeLayout = layouts[layoutIndex] || null;
  const activeLayoutSrc = layoutImage(activeLayout);
  const reraScanners = (project?.reraScannerImage || []).filter((r) => r?.image);
  const banner =
    typeof project?.bannerImage === "string" ? project.bannerImage.trim() : "";
  const brochures = (project?.browcherPdf || []).filter((b) => b?.file);

  const allFeatures = project?.features || [];
  const visibleFeatures = showAllFeatures
    ? allFeatures
    : allFeatures.slice(0, FEATURE_LIMIT);
  const hasMoreFeatures = allFeatures.length > FEATURE_LIMIT;

  const allGallery = project?.galleryImages || [];
  const visibleGallery = showAllGallery
    ? allGallery
    : allGallery.slice(0, GALLERY_LIMIT);
  const hasMoreGallery = allGallery.length > GALLERY_LIMIT;

  const runDownload = async (key, fn) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(err.message || "Download failed");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.page}>
        <Link href="/projects" className={styles.back}>
          ← Back to projects
        </Link>
        <p className={styles.error}>{error || "Project not found"}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/projects" className={styles.back}>
        ← Back to projects
      </Link>

      <header className={styles.detailHeader}>
        <p className={styles.eyebrow}>Project</p>
        <h1 className={styles.title}>{project.name}</h1>
      </header>

      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.banner}
          src={banner}
          alt={`${project.name} banner`}
        />
      ) : null}

      {detailRows.length ? (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Details</h2>
          <dl className={styles.detailGrid}>
            {detailRows.map((row) => (
              <div key={row.label} className={styles.detailItem}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {project.description ? (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.desc}>{project.description}</p>
        </section>
      ) : null}

      {allFeatures.length ? (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <ul className={styles.featureGrid}>
            {visibleFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {hasMoreFeatures ? (
            <button
              type="button"
              className={styles.moreBtn}
              onClick={() => setShowAllFeatures((v) => !v)}
            >
              {showAllFeatures
                ? "Show less"
                : `Show more (${allFeatures.length - FEATURE_LIMIT} more)`}
            </button>
          ) : null}
        </section>
      ) : null}

      {allGallery.length ? (
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Gallery</h2>
            <button
              type="button"
              className={styles.dlBtn}
              disabled={busy === "gallery"}
              onClick={() =>
                runDownload("gallery", () => downloadGalleryZip(project))
              }
            >
              {busy === "gallery" ? "Preparing…" : "Download all"}
            </button>
          </div>
          <div className={styles.galleryGrid}>
            {visibleGallery.map((g) => (
              <figure key={g._id || g.image} className={styles.galleryItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image} alt={g.title || project.name} />
                {g.title ? <figcaption>{g.title}</figcaption> : null}
              </figure>
            ))}
          </div>
          {hasMoreGallery ? (
            <button
              type="button"
              className={styles.moreBtn}
              onClick={() => setShowAllGallery((v) => !v)}
            >
              {showAllGallery
                ? "Show less"
                : `Show more (${allGallery.length - GALLERY_LIMIT} more)`}
            </button>
          ) : null}
        </section>
      ) : null}

      {layouts.length ? (
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Layouts</h2>
            <button
              type="button"
              className={styles.dlBtn}
              disabled={!activeLayoutSrc || busy === "layout"}
              onClick={() =>
                runDownload("layout", () =>
                  downloadLayoutImage(project.name, activeLayout)
                )
              }
            >
              {busy === "layout" ? "Saving…" : "Download"}
            </button>
          </div>
          <div className={styles.layoutTabs} role="tablist">
            {layouts.map((l, i) => (
              <button
                key={l._id || l.title || i}
                type="button"
                role="tab"
                aria-selected={i === layoutIndex}
                className={`${styles.layoutTab} ${
                  i === layoutIndex ? styles.layoutTabActive : ""
                }`}
                onClick={() => setLayoutIndex(i)}
              >
                <span className={styles.layoutTabTitle}>
                  {l.title || `Layout ${i + 1}`}
                </span>
                {l.area ? (
                  <span className={styles.layoutTabMeta}>{l.area} sq.ft</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className={styles.layoutStage}>
            {activeLayoutSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeLayoutSrc}
                alt={activeLayout?.title || "Layout"}
              />
            ) : (
              <p className={styles.muted}>No layout image</p>
            )}
          </div>
        </section>
      ) : null}

      {reraScanners.length ? (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>RERA scanner</h2>
          <div className={styles.reraRow}>
            {reraScanners.map((r) => (
              <figure key={r._id || r.image} className={styles.reraCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt={r.title || "RERA QR"} />
                {r.title ? <figcaption>{r.title}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {(brochures.length || project.walkthroughVideo) && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Documents & video</h2>
          <div className={styles.docList}>
            {brochures.map((b, i) => (
              <div key={b._id || b.file} className={styles.docRow}>
                <span className={styles.docLabel}>
                  Brochure{b.title ? `: ${b.title}` : ""}
                </span>
                <button
                  type="button"
                  className={styles.dlBtn}
                  disabled={busy === `pdf-${i}`}
                  onClick={() =>
                    runDownload(`pdf-${i}`, () =>
                      downloadBrochure(b, project.name)
                    )
                  }
                >
                  {busy === `pdf-${i}` ? "Saving…" : "Download PDF"}
                </button>
              </div>
            ))}
            {project.walkthroughVideo ? (
              <div className={styles.docRow}>
                <span className={styles.docLabel}>Walkthrough video</span>
                <a
                  className={styles.dlBtn}
                  href={project.walkthroughVideo}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
