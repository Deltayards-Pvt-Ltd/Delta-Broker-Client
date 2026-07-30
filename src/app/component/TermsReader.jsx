"use client";

import { useEffect, useRef, useState } from "react";
import { TC_PREAMBLE, TC_SECTIONS, TC_VERSION } from "@/content/tc";
import styles from "./TermsReader.module.css";

export default function TermsReader({ onReachedEnd }) {
  const scrollerRef = useRef(null);
  const endRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const fired = useRef(false);

  const markDone = () => {
    if (fired.current) return;
    fired.current = true;
    setReachedEnd(true);
    onReachedEnd?.();
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    const end = endRef.current;
    if (!scroller || !end) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) markDone();
      },
      { root: scroller, threshold: 0.55 }
    );

    io.observe(end);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReachedEnd]);

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
    // Initial measure (short docs / resize)
    onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.version}>
          Channel Partner Agreement · v{TC_VERSION}
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

      {!reachedEnd ? (
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
              <h2>Terms &amp; Conditions</h2>
              <p>Channel Partner Empanelment Agreement</p>
            </header>

            {TC_PREAMBLE.map((p, i) => (
              <p key={`pre-${i}`} className={styles.para}>
                {p}
              </p>
            ))}

            {TC_SECTIONS.map((section) => (
              <section key={section.title} className={styles.section}>
                <h3>{section.title}</h3>
                {section.paras.map((para, i) => (
                  <p key={`${section.title}-${i}`} className={styles.para}>
                    {para}
                  </p>
                ))}
              </section>
            ))}

            <p className={styles.endNote}>
              End of agreement — you may now accept below.
            </p>
            <div ref={endRef} className={styles.endMarker} aria-hidden />
          </article>
        </div>
      </div>
    </div>
  );
}
