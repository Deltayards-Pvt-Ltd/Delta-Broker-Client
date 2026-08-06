/** Shared pending-approvals count (sidebar + dashboard badges). */

let pendingCount = 0;
const listeners = new Set();

export function getPendingCount() {
  return pendingCount;
}

export function setPendingCount(n) {
  const next = Math.max(0, Number(n) || 0);
  if (next === pendingCount) return;
  pendingCount = next;
  listeners.forEach((fn) => {
    try {
      fn(pendingCount);
    } catch {
      /* ignore */
    }
  });
}

export function subscribePendingCount(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
