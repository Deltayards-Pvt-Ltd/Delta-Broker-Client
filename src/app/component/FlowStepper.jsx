"use client";

import styles from "./FlowStepper.module.css";

const STEPS = [
  { key: "register", label: "Register" },
  { key: "pending", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "browse", label: "Projects" },
];

export default function FlowStepper({ current = "register" }) {
  const idx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className={styles.row} aria-label="Partner journey">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.key} className={styles.item}>
            <div
              className={`${styles.dot} ${done || active ? styles.dotOn : ""} ${
                active ? styles.dotActive : ""
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={`${styles.label} ${active ? styles.labelActive : ""} ${
                done ? styles.labelDone : ""
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 ? (
              <div
                className={`${styles.line} ${done ? styles.lineDone : ""}`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
