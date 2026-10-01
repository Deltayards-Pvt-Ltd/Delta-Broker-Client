"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/auth";
import styles from "./TermsReader.module.css";

export default function TermsReader({ onReachedEnd, mode = "accept" }) {
  const viewOnly = mode === "view";
  const scrollerRef = useRef(null);
  const endRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [loadError, setLoadError] = useState("");
  const fired = useRef(false);

  const markDone = () => {
    if (fired.current) return;
    fired.current = true;
    setReachedEnd(true);
    onReachedEnd?.();
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/policy`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Policy is not available");
        if (!cancelled) setPolicy(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Policy is not available");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const end = endRef.current;
    if (!scroller || !end || !policy) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) markDone();
      },
      { root: scroller, threshold: 0.55 }
    );

    io.observe(end);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReachedEnd, policy]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) {
      setProgress(1);
      markDone();
      return;
    }

    const p = Math.min(1, el.scrollTop / scrollable);
    setProgress(p);
    if (p >= 0.985) markDone();
  };

  useEffect(() => {
    onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy]);

  const pct = Math.round(progress * 100);

  return (
    <div className={viewOnly ? `${styles.wrap} ${styles.wrapView}` : styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.version}>
          {policy?.title || "DCP policy"}
        </span>
        <span className={styles.pctBlock} aria-live="polite">
          <span className={styles.pctNum}>{pct}%</span>
          <span className={styles.pctLabel}>read</span>
        </span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Agreement reading progress"
      >
        <div
          className={styles.progressFill}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>

      {loadError ? (
        <p className={styles.hint}>{loadError}</p>
      ) : !policy ? (
        <p className={styles.hint}>Loading the agreement…</p>
      ) : viewOnly ? null : !reachedEnd ? (
        <p className={styles.hint}>Scroll the agreement to the end to unlock acceptance.</p>
      ) : (
        <p className={styles.hintDone}>
          You’ve reached the end — you can accept below.
        </p>
      )}

      <div className={styles.paperShell}>
        <div
          ref={scrollerRef}
          className={styles.scroller}
          onScroll={onScroll}
        >
          <article className={styles.paper}>
            <header className={styles.paperHead}>
              <h2>{policy?.title || "DCP policy"}</h2>
            </header>

            {(policy?.preamble || []).map((p, i) => (
              <p key={`pre-${i}`} className={styles.para}>
                {p}
              </p>
            ))}

            {(policy?.sections || []).map((section, sectionIndex) => (
              <section key={`${section.title}-${sectionIndex}`} className={styles.section}>
                <h3>{section.title}</h3>
                {section.paras.map((para, i) => (
                  <p key={`${section.title}-${i}`} className={styles.para}>
                    {para}
                  </p>
                ))}
              </section>
            ))}

            {viewOnly ? null : (
              <p className={styles.endNote}>
                End of agreement — you may now accept below.
              </p>
            )}
            <div ref={endRef} className={styles.endMarker} aria-hidden />
          </article>
        </div>
      </div>
    </div>
  );
}
