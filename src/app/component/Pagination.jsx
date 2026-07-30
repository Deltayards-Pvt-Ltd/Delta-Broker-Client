"use client";

import styles from "./Pagination.module.css";

const DEFAULT_LIMITS = [10, 25, 50];

/** Build [1, '…', 4, 5, 6, '…', 12] style page list */
export function buildPageItems(page, totalPages) {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const set = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (current >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
    set.add(total - 3);
  }

  const sorted = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const items = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(sorted[i]);
  }
  return items;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_LIMITS,
  disabled = false,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);
  const safeLimit = limit || 10;
  const safeTotal = total ?? 0;
  const from = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const to = Math.min(safePage * safeLimit, safeTotal);
  const items = buildPageItems(safePage, safeTotalPages);

  if (safeTotal === 0) return null;

  return (
    <div className={styles.pager}>
      <div className={styles.left}>
        <p className={styles.meta}>
          Showing {from}–{to} of {safeTotal}
        </p>
        {typeof onLimitChange === "function" ? (
          <label className={styles.limit}>
            <span className={styles.limitLabel}>Per page</span>
            <select
              value={safeLimit}
              disabled={disabled}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav className={styles.nav} aria-label="Pagination">
        <button
          type="button"
          className={styles.btn}
          disabled={disabled || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          Prev
        </button>

        <div className={styles.pages}>
          {items.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className={styles.ellipsis} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`${styles.pageBtn} ${
                  item === safePage ? styles.pageBtnActive : ""
                }`}
                disabled={disabled}
                aria-current={item === safePage ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className={styles.btn}
          disabled={disabled || safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
